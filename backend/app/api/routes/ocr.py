import time
import logging
import uuid
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Request
from app.core.rate_limit import limiter
from app.utils.validate_image import ensure_decodable_image, validate_image
from app.utils.preprocess import preprocess_image
from app.services.ocr.base import OCRUnavailable
from app.services.ocr.router import OCRRouter
from app.schemas.ocr import OCRResponse
from app.services.auth.jwt_handler import extract_user_from_request
from app.core.security import reserve_daily_quota
from app.core.config import settings
from app.services import storage


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ocr", tags=["ocr"])

ocr_router = OCRRouter()
_request_id_counter = 0

_CONTENT_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
}

# Keys a client may OCR by reference: its own recent OCR uploads and
# contribution images. Line crops and legacy samples are internal.
_OCR_KEY_PREFIXES = ("ocr/", "uploads/", "rendered/")


def _next_request_id():
    global _request_id_counter
    _request_id_counter += 1
    return f"{int(time.time())}-{_request_id_counter}"


def _content_type_from_key(key: str) -> str:
    if key.endswith(".png"):
        return "image/png"
    if key.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    return "image/png"


@router.post("", response_model=OCRResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def ocr(
    request: Request,
    image: UploadFile = File(None),
    image_key: str = Form(None),
    engine: str | None = None,
    purpose: str = Form("ocr"),
):
    request_id = _next_request_id()
    logger.info(f"OCR request {request_id}")

    if image is None and image_key is None:
        raise HTTPException(status_code=400, detail="Either 'image' or 'image_key' is required")
    if engine is not None and engine not in ocr_router.engine_order:
        raise HTTPException(status_code=400, detail=f"Unknown engine '{engine}'")
    if image_key is not None and not image_key.startswith(_OCR_KEY_PREFIXES):
        raise HTTPException(status_code=400, detail="Invalid object key")

    request.state.user = await extract_user_from_request(request)
    remaining, release_quota = await reserve_daily_quota(request)

    # From here on, any failure gives the quota back.
    try:
        if image is not None:
            image_bytes = await validate_image(image)
            ensure_decodable_image(image_bytes)
            ext = _CONTENT_TO_EXT.get(image.content_type or "", "png")
            prefix = "rendered/" if purpose == "sample" else "ocr/"
            key = f"{prefix}{uuid.uuid4().hex}.{ext}"
            await storage.put_object(key, image_bytes, image.content_type or "image/png")
            source_filename = image.filename
            content_type = image.content_type
        else:
            key = image_key
            image_bytes = await storage.get_object(key)
            ensure_decodable_image(image_bytes)
            content_type = _content_type_from_key(key)
            source_filename = key

        processed_bytes = preprocess_image(image_bytes)

        start_time = time.time()
        result = await ocr_router.extract(processed_bytes, engine=engine)
        process_time = time.time() - start_time
    except OCRUnavailable as e:
        await release_quota()
        logger.warning(f"Request {request_id}: all OCR engines failed: {e}")
        if e.retry_after:
            raise HTTPException(
                status_code=429,
                detail=f"OCR capacity exhausted. Try again in ~{e.retry_after}s.",
                headers={"Retry-After": str(e.retry_after)},
            ) from None
        raise HTTPException(status_code=503, detail="OCR is temporarily unavailable. Please try again later.") from None
    except HTTPException:
        await release_quota()
        raise
    except Exception:
        await release_quota()
        logger.exception(f"Request {request_id}: Unexpected error")
        raise HTTPException(
            status_code=500,
            detail={"error": "Internal Server Error", "request_id": request_id},
        ) from None

    logger.info(f"Request {request_id}: {result.engine} done in {process_time:.2f}s")

    # OCR uploads are never added to the annotation dataset: the privacy page
    # promises no human review and deletion within 24 hours (the ocr/ prefix
    # expires via a MinIO lifecycle rule). Training data comes only from the
    # Contribute flow.
    return OCRResponse(
        text=result.text,
        confidence=result.confidence,
        engine=result.engine,
        metadata={
            "filename": source_filename,
            "content_type": content_type,
            "size": len(image_bytes),
            "processing_time_ms": int(process_time * 1000),
            "request_id": request_id,
            "daily_remaining": remaining,
            "image_key": key,
        },
    )
