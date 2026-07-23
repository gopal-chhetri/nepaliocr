from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import redis.asyncio as redis
from app.core.config import settings
import time
import logging

logger = logging.getLogger(__name__)

_redis_pool = None


async def get_redis():
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_pool


async def check_daily_quota(request: Request) -> tuple[str, int]:
    user = getattr(request.state, "user", None)
    client_ip = request.client.host if request.client else "unknown"

    if user:
        identifier = f"user:{user['id']}"
        limit = settings.DAILY_LIMIT_AUTHENTICATED
    else:
        identifier = f"ip:{client_ip}"
        limit = settings.DAILY_LIMIT_ANONYMOUS

    try:
        r = await get_redis()
        key = f"ocr_daily:{identifier}"
        current = await r.get(key)
        if current is None:
            now = time.time()
            midnight = int(now - (now % 86400) + 86400)
            ttl = int(midnight - now)
            await r.setex(key, ttl, 1)
            remaining = limit - 1
        else:
            current_val = int(current)
            if current_val >= limit:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "detail": "Daily limit reached. Register for a higher quota." if not user else "Daily limit reached. Try again tomorrow.",
                        "retry_after": "midnight UTC",
                    },
                )
            await r.incr(key)
            remaining = limit - current_val - 1
        return identifier, max(0, remaining)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Redis unavailable for quota check: {e}")
        return identifier, limit


async def get_rate_limit_middleware():
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from slowapi.middleware import SlowAPIMiddleware

    limiter = Limiter(key_func=get_remote_address, default_limits=[])
    return limiter, SlowAPIMiddleware