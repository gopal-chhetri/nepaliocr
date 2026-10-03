import logging
import time
from collections.abc import Awaitable, Callable

import redis.asyncio as redis
from fastapi import HTTPException, Request

from app.core.config import settings
from app.core.rate_limit import client_ip

logger = logging.getLogger(__name__)

_redis_pool = None


async def get_redis():
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_pool


def _quota_subject(request: Request) -> tuple[str, int, bool]:
    """(identifier, daily limit, is_authenticated) for the caller."""
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user['id']}", settings.DAILY_LIMIT_AUTHENTICATED, True
    return f"ip:{client_ip(request)}", settings.DAILY_LIMIT_ANONYMOUS, False


def _seconds_until_utc_midnight() -> int:
    now = time.time()
    return max(1, int(86400 - (now % 86400)))


async def _noop() -> None:
    return None


async def reserve_daily_quota(request: Request) -> tuple[int, Callable[[], Awaitable[None]]]:
    """Atomically take one OCR from today's quota.

    Returns (remaining, release); call release() if the request then fails so
    the attempt doesn't count. Raises 429 when the quota is used up.
    """
    identifier, limit, authenticated = _quota_subject(request)
    key = f"ocr_daily:{identifier}"

    try:
        r = await get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            pipe.expire(key, _seconds_until_utc_midnight(), nx=True)
            used, _ = await pipe.execute()
    except Exception as e:
        # Anonymous OCR spends the paid API budget, so don't run it unmetered.
        if not authenticated:
            logger.error(f"Redis unavailable for quota check, refusing anonymous OCR: {e}")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable") from None
        logger.warning(f"Redis unavailable for quota check, allowing signed-in user: {e}")
        return limit, _noop

    async def release() -> None:
        try:
            await r.decr(key)
        except Exception as e:
            logger.warning(f"Failed to release quota for {identifier}: {e}")

    if used > limit:
        await release()
        raise HTTPException(
            status_code=429,
            detail={
                "detail": "Daily limit reached. Try again tomorrow."
                if authenticated
                else "Daily limit reached. Register for a higher quota.",
                "retry_after": "midnight UTC",
            },
        )
    return max(0, limit - used), release


async def get_daily_usage(request: Request) -> dict:
    identifier, limit, _ = _quota_subject(request)

    used = 0
    try:
        r = await get_redis()
        current = await r.get(f"ocr_daily:{identifier}")
        if current is not None:
            used = int(current)
    except Exception as e:
        logger.warning(f"Redis unavailable for usage check: {e}")

    return {
        "limit": limit,
        "used": min(used, limit),
        "remaining": max(0, limit - used),
    }
