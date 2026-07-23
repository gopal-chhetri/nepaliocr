import time
import base64
import logging
import json
import httpx
from app.services.ocr.base import OCRProvider, OCRResult
from app.core.config import settings
from app.utils.api_key_rotator import APIKeyRotator

logger = logging.getLogger(__name__)


FREE_FALLBACK_MODELS = [
    "google/gemini-2.0-flash-001",
    "nvidia/nemotron-nano-12b-v2-vl:free",
]


class OpenRouterProvider(OCRProvider):
    def __init__(self):
        self.key_rotator = APIKeyRotator(settings.OPENROUTER_API_KEYS)
        self.primary_model = settings.OPENROUTER_MODEL
        self._available = bool(settings.OPENROUTER_API_KEYS)

    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        if not self._available:
            return OCRResult(
                text="OpenRouter is not configured",
                engine="openrouter",
                processing_time_ms=0,
            )

        start = time.time()
        api_key = self.key_rotator.get_next_key()

        b64 = base64.b64encode(image_bytes).decode()
        data_uri = f"data:image/jpeg;base64,{b64}"

        # Candidate models list with primary model first
        candidate_models = [self.primary_model]
        for fallback in FREE_FALLBACK_MODELS:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ocr.soylab.dpdns.org",
        }

        last_error = None
        async with httpx.AsyncClient(timeout=60) as client:
            for model_name in candidate_models:
                payload = {
                    "model": model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        "Extract all text from this image. "
                                        "Include any Nepali/Devanagari characters. "
                                        "Preserve the text formatting and structure. "
                                        "Return only the extracted text without additional commentary."
                                    ),
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": data_uri},
                                },
                            ],
                        }
                    ],
                    "temperature": 0.1,
                }

                try:
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    elapsed = int((time.time() - start) * 1000)

                    if response.status_code == 200:
                        data = response.json()
                        text = data["choices"][0]["message"]["content"].strip()
                        logger.info(f"OpenRouter ({model_name}) done in {elapsed}ms")
                        return OCRResult(
                            text=text or "No text found in image",
                            engine=f"openrouter ({model_name})",
                            processing_time_ms=elapsed,
                        )

                    if response.status_code == 429:
                        retry_after = response.headers.get("Retry-After", "60")
                        self.key_rotator.mark_key_as_failed(api_key, f"retryDelay: {retry_after}s")
                        last_error = f"OpenRouter rate-limited. Retry after {retry_after}s."
                        break  # Stop trying other models on rate-limit with this key

                    # If 404 (endpoint removed/invalid) or other 4xx/5xx, record error & try next candidate model
                    body = response.text[:500]
                    last_error = f"OpenRouter API error ({response.status_code}): {body}"
                    logger.warning(f"Model '{model_name}' failed with {response.status_code}, trying fallback...")

                except httpx.TimeoutException:
                    last_error = f"OpenRouter request timed out for model {model_name}"
                    logger.warning(last_error)

        if last_error:
            self.key_rotator.mark_key_as_failed(api_key, last_error)
            raise RuntimeError(last_error)

        raise RuntimeError("OpenRouter failed across all candidate models")