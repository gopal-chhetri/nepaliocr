from fastapi import UploadFile, HTTPException
from app.core.config import settings


async def validate_image(image: UploadFile) -> bytes:
    if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )

    image_bytes = await image.read()
    if len(image_bytes) > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of {settings.MAX_IMAGE_SIZE // (1024 * 1024)}MB",
        )

    return image_bytes