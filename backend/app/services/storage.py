import asyncio
import io
import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from minio import Minio
from minio.commonconfig import ENABLED, Filter
from minio.datatypes import PostPolicy
from minio.lifecycleconfig import Expiration, LifecycleConfig, Rule

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Minio | None = None
_public_client: Minio | None = None

# Object keys must live under one of these prefixes.
# uploads/   -> original uploaded images (handwritten text photos)
# rendered/  -> AI/canvas-rendered text images derived from generated lines
# ocr/       -> images uploaded for OCR testing
# lines/     -> OpenCV line crops of an upload (written by the worker)
# words/     -> (reserved) OpenCV word crops
# samples/   -> legacy AI-rendered sample images (kept for existing dev data)
ALLOWED_KEY_PREFIXES = ("uploads/", "rendered/", "ocr/", "samples/", "lines/", "words/")

# Images submitted to the public OCR tool. The privacy page promises they are
# deleted within 24 hours and never reviewed by people, so they expire via a
# bucket lifecycle rule and are never handed out as presigned GET URLs.
OCR_PREFIX = "ocr/"
OCR_RETENTION_DAYS = 1


def get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
            region="us-east-1",
        )
    return _client


def get_public_client() -> Minio:
    global _public_client
    if _public_client is None:
        _public_client = Minio(
            settings.MINIO_PUBLIC_ENDPOINT or settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_PUBLIC_SECURE if settings.MINIO_PUBLIC_SECURE is not None else settings.MINIO_SECURE,
            region="us-east-1",
        )
    return _public_client


def _ocr_expiry_lifecycle() -> LifecycleConfig:
    return LifecycleConfig(
        [
            Rule(
                ENABLED,
                rule_filter=Filter(prefix=OCR_PREFIX),
                rule_id="expire-ocr-uploads",
                expiration=Expiration(days=OCR_RETENTION_DAYS),
            )
        ]
    )


async def ensure_bucket() -> None:
    try:
        client = get_client()
        if not await asyncio.to_thread(client.bucket_exists, settings.MINIO_BUCKET):
            await asyncio.to_thread(client.make_bucket, settings.MINIO_BUCKET)
            logger.info(f"Created bucket '{settings.MINIO_BUCKET}'")
        # Idempotent: re-applying the same lifecycle config is a no-op.
        await asyncio.to_thread(
            client.set_bucket_lifecycle, settings.MINIO_BUCKET, _ocr_expiry_lifecycle()
        )
    except Exception as e:
        logger.warning(f"MinIO bucket setup failed: {e}")


async def put_object(key: str, data: bytes, content_type: str) -> str:
    client = get_client()
    await asyncio.to_thread(
        client.put_object,
        settings.MINIO_BUCKET,
        key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return key


async def validate_key(key: str) -> str:
    if not key or not key.startswith(ALLOWED_KEY_PREFIXES):
        raise HTTPException(status_code=400, detail="Invalid object key")
    return key


async def object_exists(key: str) -> bool:
    client = get_client()
    try:
        await asyncio.to_thread(client.stat_object, settings.MINIO_BUCKET, key)
        return True
    except HTTPException:
        raise
    except Exception:
        return False


async def get_object(key: str) -> bytes:
    await validate_key(key)
    client = get_client()
    try:
        response = await asyncio.to_thread(client.get_object, settings.MINIO_BUCKET, key)
        try:
            return await asyncio.to_thread(response.read)
        finally:
            await asyncio.to_thread(response.close)
            await asyncio.to_thread(response.release_conn)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"MinIO get_object failed for '{key}': {e}")
        raise HTTPException(status_code=404, detail="Object not found") from None


def public_bucket_url() -> str:
    """Browser-reachable URL of the bucket, the target of presigned POSTs."""
    secure = settings.MINIO_PUBLIC_SECURE if settings.MINIO_PUBLIC_SECURE is not None else settings.MINIO_SECURE
    endpoint = settings.MINIO_PUBLIC_ENDPOINT or settings.MINIO_ENDPOINT
    return f"{'https' if secure else 'http'}://{endpoint}/{settings.MINIO_BUCKET}"


async def presign_post(key: str, content_type: str, max_bytes: int, expires: int = 300) -> dict[str, str]:
    """Form fields for a browser POST upload of exactly this key.

    Unlike a presigned PUT, a POST policy is enforced by MinIO itself: the
    upload is rejected unless it matches the key, content type and size range.
    """
    policy = PostPolicy(settings.MINIO_BUCKET, datetime.now(timezone.utc) + timedelta(seconds=expires))
    policy.add_equals_condition("key", key)
    policy.add_equals_condition("Content-Type", content_type)
    policy.add_content_length_range_condition(1, max_bytes)
    fields = await asyncio.to_thread(get_public_client().presigned_post_policy, policy)
    return {**fields, "key": key, "Content-Type": content_type}


async def presign_get(key: str) -> str:
    await validate_key(key)
    if key.startswith(OCR_PREFIX):
        raise HTTPException(status_code=400, detail="Invalid object key")
    client = get_public_client()
    return await asyncio.to_thread(
        client.presigned_get_object, settings.MINIO_BUCKET, key
    )