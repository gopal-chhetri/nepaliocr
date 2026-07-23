from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.models.user import User, Base
from app.services.auth.password_handler import hash_password, verify_password
from app.services.auth.jwt_handler import create_access_token
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

_engine = None
_session_local = None


async def get_db() -> AsyncSession:
    global _engine, _session_local
    if _engine is None:
        _engine = create_async_engine(settings.DATABASE_URL, echo=False)
        _session_local = async_sessionmaker(_engine, expire_on_commit=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return _session_local()


async def register_user(email: str, password: str) -> dict:
    session = await get_db()
    try:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user = User(
            email=email,
            password_hash=hash_password(password),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        token = create_access_token(str(user.id), user.email)
        return {"token": token, "user": {"id": str(user.id), "email": user.email}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")
    finally:
        await session.close()


async def login_user(email: str, password: str) -> dict:
    session = await get_db()
    try:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(str(user.id), user.email)
        return {"token": token, "user": {"id": str(user.id), "email": user.email}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")
    finally:
        await session.close()