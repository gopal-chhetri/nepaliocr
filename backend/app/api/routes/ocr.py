import time
import logging
import uuid
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Request
from fastapi.params import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.utils.validate_image import validate_image
from app.utils.preprocess import preprocess_image
from app.services.ocr.router import OCRRouter
from app.schemas.ocr import OCRResponse
from app.services.auth.jwt_handler import extract_user_from_request
from app.core.security import check_daily_quota
from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document
from app.jobs import enqueue_segmentation
from app.services import storage


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ocr", tags=["ocr"])

ocr_router = OCRRouter()
limiter = Limiter(key_func=get_remote_address, default_limits=[])
_request_id_counter = 0

_CONTENT_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
}


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
    db: AsyncSession = Depends(get_db),
):
    request_id = _next_request_id()
    logger.info(f"OCR request {request_id}")

    segments_enqueued = False
    try:
        user = await extract_user_from_request(request)
        request.state.user = user

        _, remaining = await check_daily_quota(request)

        if image is None and image_key is None:
            raise HTTPException(status_code=400, detail="Either 'image' or 'image_key' is required")

        if image is not None:
            image_bytes = await validate_image(image)
            ext = _CONTENT_TO_EXT.get(image.content_type or "", "png")
            prefix = "rendered/" if purpose == "sample" else "ocr/"
            key = f"{prefix}{uuid.uuid4().hex}.{ext}"
            await storage.put_object(key, image_bytes, image.content_type or "image/png")
            source_filename = image.filename
            content_type = image.content_type
        else:
            key = image_key
            image_bytes = await storage.get_object(key)
            content_type = _content_type_from_key(key)
            source_filename = key

        processed_bytes = preprocess_image(image_bytes)

        start_time = time.time()
        result = await ocr_router.extract(processed_bytes, engine=engine)
        process_time = time.time() - start_time

        logger.info(f"Request {request_id}: {result.engine} done in {process_time:.2f}s")

        if purpose == "ocr" and key:
            try:
                existing = await db.execute(select(Document).where(Document.image_key == key))
                if existing.scalar_one_or_none() is None:
                    document = Document(
                        image_key=key,
                        section="ocr",
                        source="ocr",
                        expected_text=None,
                        lines_requested=0,
                        status="pending",
                    )
                    db.add(document)
                    await db.commit()
                    await db.refresh(document)
                    await enqueue_segmentation(document.id)
                    segments_enqueued = True
            except Exception as e:
                logger.warning(f"OCR segmentation enqueue skipped for '{key}': {e}")

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
                "segments_enqueued": segments_enqueued,
            },
        )
    except HTTPException:
        raise
    except RuntimeError as e:
        retry_after = ocr_router.providers["openrouter"].key_rotator.retry_after_seconds()
        msg = str(e)
        if retry_after:
            msg = f"API quota exhausted. Try again in ~{retry_after}s."
        raise HTTPException(status_code=429, detail=msg)
    except Exception as e:
        logger.exception(f"Request {request_id}: Unexpected error")
        raise HTTPException(
            status_code=500,
            detail={"error": "Internal Server Error", "message": str(e), "request_id": request_id},
        )