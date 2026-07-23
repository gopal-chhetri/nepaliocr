import time
import logging
from app.services.ocr.base import OCRProvider, OCRResult

logger = logging.getLogger(__name__)


class PaddleOCRProvider(OCRProvider):
    def __init__(self):
        self._model = None
        self._initialized = False

    async def _lazy_init(self):
        if not self._initialized:
            try:
                from paddleocr import PaddleOCR
                self._model = PaddleOCR(
                    lang="devanagari",
                    use_angle_cls=True,
                    show_log=False,
                )
                self._initialized = True
                logger.info("PaddleOCR initialized with devanagari model")
            except ImportError:
                logger.warning("PaddleOCR not installed — provider unavailable")
                self._initialized = True
                self._model = None

    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        await self._lazy_init()
        if self._model is None:
            return OCRResult(
                text="PaddleOCR is not available",
                engine="paddleocr",
                processing_time_ms=0,
            )

        start = time.time()
        try:
            import tempfile, os
            from PIL import Image
            import io

            img = Image.open(io.BytesIO(image_bytes))
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                img.save(tmp.name)
                tmp_path = tmp.name

            lines = self._model.ocr(tmp_path)
            os.unlink(tmp_path)

            elapsed = int((time.time() - start) * 1000)
            text_parts = []
            confidences = []
            if lines and lines[0]:
                for line in lines[0]:
                    text = line[1][0]
                    conf = line[1][1]
                    text_parts.append(text)
                    confidences.append(conf)

            avg_conf = sum(confidences) / len(confidences) if confidences else None
            return OCRResult(
                text="\n".join(text_parts) if text_parts else "No text found",
                engine="paddleocr",
                confidence=avg_conf,
                processing_time_ms=elapsed,
            )
        except Exception as e:
            logger.error(f"PaddleOCR error: {e}")
            raise