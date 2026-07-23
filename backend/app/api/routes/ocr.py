import time
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.utils.validate_image import validate_image
from app.utils.preprocess import preprocess_image
from app.services.ocr.router import OCRRouter
from app.schemas.ocr import OCRResponse
from app.services.auth.jwt_handler import extract_user_from_request
from app.core.security import check_daily_quota
from app.core.config import settings


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ocr", tags=["ocr"])

ocr_router = OCRRouter()
limiter = Limiter(key_func=get_remote_address, default_limits=[])
_request_id_counter = 0


def _next_request_id():
    global _request_id_counter
    _request_id_counter += 1
    return f"{int(time.time())}-{_request_id_counter}"


@router.post("", response_model=OCRResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def ocr(
    request: Request,
    image: UploadFile = File(...),
    engine: str | None = None,
):
    request_id = _next_request_id()
    logger.info(f"OCR request {request_id}")

    try:
        user = await extract_user_from_request(request)
        request.state.user = user

        _, remaining = await check_daily_quota(request)

        image_bytes = await validate_image(image)
        processed_bytes = preprocess_image(image_bytes)

        start_time = time.time()
        result = await ocr_router.extract(processed_bytes, engine=engine)
        process_time = time.time() - start_time

        logger.info(f"Request {request_id}: {result.engine} done in {process_time:.2f}s")

        return OCRResponse(
            text=result.text,
            confidence=result.confidence,
            engine=result.engine,
            metadata={
                "filename": image.filename,
                "content_type": image.content_type,
                "size": len(image_bytes),
                "processing_time_ms": int(process_time * 1000),
                "request_id": request_id,
                "daily_remaining": remaining,
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