import uuid
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import annotate, ocr
from app.core.database import get_db
from app.services.auth.jwt_handler import create_access_token
from app.services.ocr.base import OCRResult, OCRUnavailable


@pytest.fixture
def ocr_client(monkeypatch):
    released = []
    stored = []

    async def reserve(request):
        async def release():
            released.append(True)

        return 5, release

    async def put_object(key, data, content_type):
        stored.append(key)

    monkeypatch.setattr(ocr, "reserve_daily_quota", reserve)
    monkeypatch.setattr(ocr.storage, "put_object", put_object)

    app = FastAPI()
    app.include_router(ocr.router, prefix="/api/v1")
    return TestClient(app), released, stored


def test_ocr_success_stores_under_ocr_prefix(ocr_client, png_bytes, monkeypatch):
    client, released, stored = ocr_client

    async def extract(data, engine=None):
        return OCRResult(text="नमस्ते", engine="openrouter")

    monkeypatch.setattr(ocr.ocr_router, "extract", extract)
    res = client.post("/api/v1/ocr", files={"image": ("a.png", png_bytes, "image/png")})
    assert res.status_code == 200
    assert res.json()["text"] == "नमस्ते"
    assert stored and stored[0].startswith("ocr/")
    assert not released


def test_ocr_engine_failure_is_503_and_refunds_quota(ocr_client, png_bytes, monkeypatch):
    client, released, _ = ocr_client

    async def extract(data, engine=None):
        raise OCRUnavailable("OpenRouter is not configured")

    monkeypatch.setattr(ocr.ocr_router, "extract", extract)
    res = client.post("/api/v1/ocr", files={"image": ("a.png", png_bytes, "image/png")})
    assert res.status_code == 503
    assert released == [True]


def test_ocr_rejects_non_image_and_refunds_quota(ocr_client):
    client, released, _ = ocr_client
    res = client.post("/api/v1/ocr", files={"image": ("a.png", b"not an image", "image/png")})
    assert res.status_code == 400
    assert released == [True]


def test_ocr_rejects_unknown_engine_before_quota(ocr_client, png_bytes):
    client, released, stored = ocr_client
    res = client.post(
        "/api/v1/ocr?engine=paddleocr", files={"image": ("a.png", png_bytes, "image/png")}
    )
    assert res.status_code == 400
    assert not stored and not released


def test_ocr_rejects_internal_object_keys(ocr_client):
    client, _, _ = ocr_client
    res = client.post("/api/v1/ocr", data={"image_key": "lines/some-doc/0.jpg"})
    assert res.status_code == 400


class _FakeSession:
    def __init__(self, rowcount: int, exists: bool):
        self.rowcount, self.exists = rowcount, exists
        self.committed = False

    async def execute(self, stmt):
        return SimpleNamespace(rowcount=self.rowcount, scalar=lambda: 0)

    async def get(self, model, key):
        return object() if self.exists else None

    async def commit(self):
        self.committed = True

    async def rollback(self):
        pass


def _annotate_client(session: _FakeSession) -> TestClient:
    app = FastAPI()
    app.include_router(annotate.router, prefix="/api/v1")

    async def fake_db():
        yield session

    app.dependency_overrides[get_db] = fake_db
    return TestClient(app)


def _auth() -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(uuid.uuid4()), 'a@b.c')}"}


def test_annotation_requires_sign_in():
    client = _annotate_client(_FakeSession(rowcount=1, exists=True))
    res = client.post(f"/api/v1/annotate/{uuid.uuid4()}", json={"text": "नमस्ते"})
    assert res.status_code == 401


def test_expired_or_invalid_token_is_401_not_anonymous():
    client = _annotate_client(_FakeSession(rowcount=1, exists=True))
    res = client.post(
        f"/api/v1/annotate/{uuid.uuid4()}",
        json={"text": "नमस्ते"},
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert res.status_code == 401


def test_annotation_succeeds_for_signed_in_user():
    session = _FakeSession(rowcount=1, exists=True)
    client = _annotate_client(session)
    res = client.post(f"/api/v1/annotate/{uuid.uuid4()}", json={"text": "नमस्ते"}, headers=_auth())
    assert res.status_code == 200
    assert session.committed


def test_annotation_never_overwrites_existing_label():
    client = _annotate_client(_FakeSession(rowcount=0, exists=True))
    res = client.post(f"/api/v1/annotate/{uuid.uuid4()}", json={"text": "नमस्ते"}, headers=_auth())
    assert res.status_code == 409


def test_annotation_unknown_segment_is_404():
    client = _annotate_client(_FakeSession(rowcount=0, exists=False))
    res = client.post(f"/api/v1/annotate/{uuid.uuid4()}", json={"text": "नमस्ते"}, headers=_auth())
    assert res.status_code == 404
