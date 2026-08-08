import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

logger = logging.getLogger(__name__)

_engine = None
_session_local = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
    return _engine


def get_session_factory():
    global _session_local
    if _session_local is None:
        _session_local = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _session_local


async def ensure_schema() -> None:
    from app import models  # noqa: F401  (registers all model tables)

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


async def get_db() -> AsyncSession:
    await ensure_schema()
    return get_session_factory()()


async def ping_database() -> bool:
    """Return True if the database accepts a connection, False otherwise."""
    try:
        async with get_engine().connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return False