from fastapi import APIRouter, HTTPException, Request
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.services.auth.auth_service import register_user, login_user
from app.core.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
@limiter.limit("10/minute")
async def register(request: Request, body: RegisterRequest):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    result = await register_user(body.email, body.password)
    return AuthResponse(**result)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest):
    result = await login_user(body.email, body.password)
    return AuthResponse(**result)