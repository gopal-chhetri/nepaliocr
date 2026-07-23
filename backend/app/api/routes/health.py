from fastapi import APIRouter
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    engine_statuses = {}
    for engine in settings.ENGINE_ORDER.split(","):
        engine = engine.strip()
        if engine == "openrouter":
            engine_statuses[engine] = "ok" if settings.OPENROUTER_API_KEYS else "unavailable"
        else:
            engine_statuses[engine] = "unavailable"

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engines": engine_statuses,
    }