import uuid
import logging

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from app.core.rate_limit import limiter
from app.services import storage
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/storage", tags=["storage"])


CONTENT_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
}


class PresignUploadRequest(BaseModel):
    filename: str = Field(default="image.jpg", max_length=255)
    content_type: str
    size: int = Field(gt=0)
    # Contribution images only; OCR images go through POST /ocr directly.
    section: str = Field(default="uploads", pattern="^(uploads|rendered)$")


class PresignGetRequest(BaseModel):
    key: str


class PresignUploadResponse(BaseModel):
    key: str
    # POST multipart/form-data to `url`: every entry of `fields`, then `file`.
    url: str
    fields: dict[str, str]
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
        "uploads": "uploads/",
        "rendered": "rendered/",
    }[body.section]
    ext = CONTENT_TO_EXT[body.content_type]
    key = f"{prefix}{uuid.uuid4().hex}.{ext}"

    fields = await storage.presign_post(key, body.content_type, settings.MAX_IMAGE_SIZE)
    return PresignUploadResponse(key=key, url=storage.public_bucket_url(), fields=fields, expires_in=300)


@router.post("/presign-get", response_model=PresignGetResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def presign_get(request: Request, body: PresignGetRequest):
    url = await storage.presign_get(body.key)
    return PresignGetResponse(url=url)