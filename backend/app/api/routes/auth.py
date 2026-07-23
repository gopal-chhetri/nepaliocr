from fastapi import APIRouter, HTTPException
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.services.auth.auth_service import register_user, login_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    result = await register_user(body.email, body.password)
    return AuthResponse(**result)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    result = await login_user(body.email, body.password)
    return AuthResponse(**result)