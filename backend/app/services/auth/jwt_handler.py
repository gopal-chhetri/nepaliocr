import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Request, HTTPException
from app.core.config import settings


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def extract_user_from_request(request: Request) -> Optional[dict]:
    """The signed-in user, or None for anonymous requests.

    A token that is present but expired or invalid is a 401 rather than a
    silent downgrade to anonymous, so the client can notice and sign out.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    return {"id": payload.get("sub"), "email": payload.get("email")}

async def require_user(request: Request) -> dict:
    """The signed-in user; 401 for anonymous requests."""
    user = await extract_user_from_request(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to do this.")
    request.state.user = user
    return user
