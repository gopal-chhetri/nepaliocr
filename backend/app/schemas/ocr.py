from pydantic import BaseModel
from typing import Optional


class OCRResponse(BaseModel):
    text: str
    confidence: Optional[float] = None
    engine: str = "gemini"
    metadata: Optional[dict] = None


class OCRResult(BaseModel):
    text: str
    confidence: Optional[float] = None
    engine: str = "gemini"
    processing_time_ms: int = 0