import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_production_rejects_default_jwt_secret():
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(ENVIRONMENT="production", JWT_SECRET="change-me-in-production")


def test_production_rejects_minio_defaults():
    with pytest.raises(ValidationError, match="MINIO"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET="x" * 40,
            MINIO_ACCESS_KEY="minioadmin",
            MINIO_SECRET_KEY="something",
        )


def test_production_accepts_real_secrets():
    Settings(
        ENVIRONMENT="production",
        JWT_SECRET="x" * 40,
        MINIO_ACCESS_KEY="ocr-app",
        MINIO_SECRET_KEY="y" * 40,
    )


def test_development_allows_defaults():
    Settings(ENVIRONMENT="development", JWT_SECRET="change-me-in-production")
