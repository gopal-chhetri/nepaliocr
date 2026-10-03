import logging

from fastapi import APIRouter, Request
from app.core.rate_limit import limiter
from app.core.config import settings
from app.core.security import get_daily_usage
from app.services.auth.jwt_handler import extract_user_from_request

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/usage", tags=["usage"])



@router.get("")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def usage(request: Request):
    user = await extract_user_from_request(request)
    request.state.user = user
    return await get_daily_usage(request)