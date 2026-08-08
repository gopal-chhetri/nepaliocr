import uuid
import logging

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services import storage
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/storage", tags=["storage"])

limiter = Limiter(key_func=get_remote_address, default_limits=[])

CONTENT_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
}


class PresignUploadRequest(BaseModel):
    filename: str = Field(default="image.jpg", max_length=255)
    content_type: str
    size: int = Field(gt=0)
    section: str = Field(default="ocr", pattern="^(ocr|sample|uploads|rendered)$")


class PresignGetRequest(BaseModel):
    key: str


class PresignUploadResponse(BaseModel):
    key: str
    url: str
    expires_in: int


class PresignGetResponse(BaseModel):
    url: str


@router.post("/presign-upload", response_model=PresignUploadResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def presign_upload(request: Request, body: PresignUploadRequest):
    if body.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type. Allowed: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )
    if body.size > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of {settings.MAX_IMAGE_SIZE // (1024 * 1024)}MB",
        )

    prefix = {
        "ocr": "ocr/",
        "sample": "samples/",
        "uploads": "uploads/",
        "rendered": "rendered/",
    }[body.section]
    ext = CONTENT_TO_EXT[body.content_type]
    key = f"{prefix}{uuid.uuid4().hex}.{ext}"

    url = await storage.presign_put(key)
    return PresignUploadResponse(key=key, url=url, expires_in=300)


@router.post("/presign-get", response_model=PresignGetResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def presign_get(request: Request, body: PresignGetRequest):
    url = await storage.presign_get(body.key)
    return PresignGetResponse(url=url)