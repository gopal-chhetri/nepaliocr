from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Optional


class OCRResult(BaseModel):
    text: str
    confidence: Optional[float] = None
    engine: str = "gemini"
    processing_time_ms: int = 0


class OCRProvider(ABC):
    @abstractmethod
    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        ...

class OCREngineError(Exception):
    """A single engine could not process the image (unconfigured, errored, rate-limited)."""


class OCRUnavailable(Exception):
    """Every engine failed. retry_after is set when the cause is a rate limit."""

    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after
