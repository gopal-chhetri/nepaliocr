from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User
from app.services.auth.password_handler import hash_password, verify_password
from app.services.auth.jwt_handler import create_access_token
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


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