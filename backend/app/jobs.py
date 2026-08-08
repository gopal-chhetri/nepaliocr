import asyncio
import logging

from arq import create_pool
from arq.connections import RedisSettings
from sqlalchemy import func as sa_func

from app.core.config import settings
from app.core.database import ensure_schema, get_session_factory
from app.models.document import Document, Segment
from app.services import storage
from app.services.segmentation import segment_lines

logger = logging.getLogger(__name__)

_pool = None


async def startup(ctx) -> None:
    await ensure_schema()


async def shutdown(ctx) -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


async def segment_document(ctx, document_id: str) -> None:
    factory = get_session_factory()
    async with factory() as db:
        document = await db.get(Document, document_id)
        if document is None:
            logger.warning(f"segment_document: document {document_id} not found")
            return

        document.status = "processing"
        await db.commit()

        try:
            raw = await storage.get_object(document.image_key)
            lines = await asyncio.to_thread(segment_lines, raw)
        except Exception as e:
            logger.exception(f"segment_document {document_id}: segmentation failed")
            document.status = "error"
            document.error = str(e)[:500]
            await db.commit()
            return

        expected_lines = (document.expected_text or "").split("\n")
        n_expected = len(expected_lines)

        for i, item in enumerate(lines):
            key = f"lines/{document.id}/{i}.jpg"
            await storage.put_object(key, item["data"], "image/jpeg")
            is_extra = i >= n_expected if n_expected > 0 else False
            expected = expected_lines[i].strip() if not is_extra and i < n_expected else None
            db.add(
                Segment(
                    document_id=document.id,
                    kind="line",
                    index=i,
                    image_key=key,
                    bbox=item["bbox"],
                    expected_text=expected or None,
                    is_extra=is_extra,
                )
            )

        document.lines_found = len(lines)
        document.status = "segmented" if lines else "error"
        if not lines:
            document.error = "No text lines detected in the image"
        document.segmented_at = sa_func.now()
        await db.commit()


async def _get_pool():
    global _pool
    if _pool is None:
        _pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _pool


async def enqueue_segmentation(document_id) -> None:
    pool = await _get_pool()
    await pool.enqueue_job("segment_document", str(document_id))


class WorkerSettings:
    functions = [segment_document]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    on_startup = startup
    on_shutdown = None
    max_jobs = 2
    job_timeout = 30
    keep_result = 0