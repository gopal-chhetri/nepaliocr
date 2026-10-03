"""One-off cleanup of OCR uploads that were added to the annotation dataset.

Before the privacy fix, every image sent to the public OCR tool became a
Document whose line crops were served to annotators. This removes those
documents (segments cascade), their line crops, and all objects under ocr/.

Usage (inside the backend container):
    python -m scripts.purge_ocr_documents --dry-run
    python -m scripts.purge_ocr_documents
"""

import argparse
import asyncio

from minio.deleteobjects import DeleteObject
from sqlalchemy import delete, select

from app.core.config import settings
from app.core.database import get_session_factory
from app.models.document import Document
from app.services.storage import OCR_PREFIX, get_client


def _delete_prefix(prefix: str, dry_run: bool) -> int:
    client = get_client()
    keys = [
        obj.object_name
        for obj in client.list_objects(settings.MINIO_BUCKET, prefix=prefix, recursive=True)
    ]
    if keys and not dry_run:
        errors = client.remove_objects(
            settings.MINIO_BUCKET, (DeleteObject(k) for k in keys)
        )
        for err in errors:  # remove_objects is lazy; iterate to execute it
            print(f"  failed to delete {err.name}: {err.message}")
    return len(keys)


async def main(dry_run: bool) -> None:
    factory = get_session_factory()
    async with factory() as db:
        result = await db.execute(select(Document.id).where(Document.section == "ocr"))
        doc_ids = [row[0] for row in result]
        print(f"OCR documents: {len(doc_ids)}")

        lines = 0
        for doc_id in doc_ids:
            lines += await asyncio.to_thread(_delete_prefix, f"lines/{doc_id}/", dry_run)
        print(f"Line crops: {lines}")

        if doc_ids and not dry_run:
            # segments.document_id is ON DELETE CASCADE
            await db.execute(delete(Document).where(Document.id.in_(doc_ids)))
            await db.commit()

    ocr_objects = await asyncio.to_thread(_delete_prefix, OCR_PREFIX, dry_run)
    print(f"Objects under {OCR_PREFIX}: {ocr_objects}")
    print("Dry run, nothing deleted." if dry_run else "Deleted.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="only report what would be deleted")
    asyncio.run(main(parser.parse_args().dry_run))
