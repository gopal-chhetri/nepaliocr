import logging
from typing import Optional

from app.core.config import settings
from app.services.ocr.base import OCRResult, OCRUnavailable
from app.services.ocr.openrouter_provider import OpenRouterProvider
from app.services.ocr.paddleocr_provider import PaddleOCRProvider

logger = logging.getLogger(__name__)

# Text a provider returns when the image really contains no text.
NO_TEXT_RESULTS = ("No text found in image", "No text found")


class OCRRouter:
    def __init__(self):
        self.providers = {
            "openrouter": OpenRouterProvider(),
            "paddleocr": PaddleOCRProvider(),
        }
        self._engine_order: list[str] = []

    @property
    def engine_order(self) -> list[str]:
        if not self._engine_order:
            raw = settings.ENGINE_ORDER
            self._engine_order = [e.strip().lower() for e in raw.split(",") if e.strip()]
        return self._engine_order

    async def extract(
        self,
        image_bytes: bytes,
        engine: Optional[str] = None,
    ) -> OCRResult:
        """Try engines in order and return the first with text.

        An engine reporting "no text" is a valid result, returned if nothing
        else finds text. Raises OCRUnavailable when every engine errored.
        """
        engines = [engine] if engine else self.engine_order
        empty_result: Optional[OCRResult] = None
        last_error = "No OCR engine is configured"

        for eng in engines:
            provider = self.providers.get(eng)
            if provider is None:
                logger.warning(f"Unknown engine '{eng}', skipping")
                continue
            try:
                result = await provider.extract_text(image_bytes)
            except Exception as e:
                logger.warning(f"Engine '{eng}' failed: {e}, falling through")
                last_error = str(e)
                continue

            if result.text and result.text not in NO_TEXT_RESULTS:
                logger.info(f"Engine '{eng}' succeeded")
                return result
            logger.info(f"Engine '{eng}' found no text, falling through")
            empty_result = empty_result or result

        if empty_result is not None:
            return empty_result

        raise OCRUnavailable(last_error, retry_after=self._retry_after())

    def _retry_after(self) -> Optional[int]:
        """Seconds until a rate-limited API key frees up, if that's the cause."""
        rotator = getattr(self.providers.get("openrouter"), "key_rotator", None)
        return rotator.retry_after_seconds() if rotator else None
