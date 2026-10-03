import pytest

from app.services.ocr.base import OCREngineError, OCRResult, OCRUnavailable
from app.services.ocr.router import OCRRouter


class _Provider:
    def __init__(self, result=None, error=None):
        self.result, self.error = result, error

    async def extract_text(self, image_bytes):
        if self.error:
            raise self.error
        return self.result


def _router(**providers) -> OCRRouter:
    router = OCRRouter()
    router._engine_order = list(providers)
    router.providers.update(providers)
    return router


async def test_returns_first_engine_with_text():
    router = _router(openrouter=_Provider(OCRResult(text="नमस्ते", engine="openrouter")))
    assert (await router.extract(b"img")).text == "नमस्ते"


async def test_no_text_is_a_result_not_an_error():
    router = _router(openrouter=_Provider(OCRResult(text="No text found in image", engine="openrouter")))
    assert (await router.extract(b"img")).text == "No text found in image"


async def test_all_engines_failing_raises():
    router = _router(openrouter=_Provider(error=OCREngineError("OpenRouter is not configured")))
    with pytest.raises(OCRUnavailable, match="not configured"):
        await router.extract(b"img")
