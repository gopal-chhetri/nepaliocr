from fastapi import APIRouter, Response
from app.core.config import settings
from app.core.database import ping_database
from app.core.security import get_redis
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["health"])


@router.get("/healthz")
async def liveness():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/health")
async def health_check(response: Response):
    engine_statuses = {}
    for engine in settings.ENGINE_ORDER.split(","):
        engine = engine.strip()
        if engine == "openrouter":
            engine_statuses[engine] = "ok" if settings.OPENROUTER_API_KEYS else "unavailable"
        else:
            engine_statuses[engine] = "unavailable"

    try:
        r = await get_redis()
        await r.ping()
        redis_status = "ok"
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        redis_status = "unreachable"

    database_status = "ok" if await ping_database() else "unreachable"

    healthy = database_status == "ok" and redis_status == "ok"
    response.status_code = 200 if healthy else 503

    return {
        "status": "ok" if healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "checks": {
            "database": database_status,
            "redis": redis_status,
        },
        "engines": engine_statuses,
    }