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