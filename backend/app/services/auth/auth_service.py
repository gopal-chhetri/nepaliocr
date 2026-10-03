from sqlalchemy import select
from app.core.database import get_session_factory
from app.models.user import User
from app.services.auth.password_handler import hash_password, verify_password
from app.services.auth.jwt_handler import create_access_token
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
import logging

logger = logging.getLogger(__name__)


async def register_user(email: str, password: str) -> dict:
    session = get_session_factory()()
    try:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        user = User(
            email=email,
            password_hash=await run_in_threadpool(hash_password, password),
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
        raise HTTPException(status_code=500, detail="Registration failed") from None
    finally:
        await session.close()


async def login_user(email: str, password: str) -> dict:
    session = get_session_factory()()
    try:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        # bcrypt takes ~250ms of CPU; keep it off the event loop.
        if not user or not await run_in_threadpool(verify_password, password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(str(user.id), user.email)
        return {"token": token, "user": {"id": str(user.id), "email": user.email}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed") from None
    finally:
        await session.close()