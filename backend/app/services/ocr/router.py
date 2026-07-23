import logging
from typing import Optional
from app.core.config import settings
from app.services.ocr.base import OCRResult
from app.services.ocr.paddleocr_provider import PaddleOCRProvider
from app.services.ocr.openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)


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
        engines = [engine] if engine else self.engine_order

        for eng in engines:
            if eng not in self.providers:
                logger.warning(f"Unknown engine '{eng}', skipping")
                continue
            try:
                provider = self.providers[eng]
                result = await provider.extract_text(image_bytes)

                if result.text and result.text not in (
                    "No text found in image", "No text found",
                    "PaddleOCR is not available",
                ):
                    logger.info(f"Engine '{eng}' succeeded")
                    return result
                else:
                    logger.warning(f"Engine '{eng}' returned no text, falling through")
            except Exception as e:
                logger.warning(f"Engine '{eng}' failed: {e}, falling through")

        return OCRResult(
            text="All OCR engines failed to extract text.",
            engine="none",
            processing_time_ms=0,
        )