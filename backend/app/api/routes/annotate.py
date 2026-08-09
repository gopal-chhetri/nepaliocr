import logging
import uuid

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.params import Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import get_db
from app.models.sample import Sample
from app.models.document import Segment
from app.services import storage
from app.services.auth.jwt_handler import extract_user_from_request

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/annotate", tags=["annotate"])

limiter = Limiter(key_func=get_remote_address, default_limits=[])


class SampleCreate(BaseModel):
    image_key: str
    expected_text: str | None = None
    ocr_text: str | None = None
    lines: int | None = Field(default=None, ge=1, le=20)


class SampleCreateResponse(BaseModel):
    sample_id: str
    image_key: str


class NextAnnotationItem(BaseModel):
    segment_id: str
    image_url: str
    kind: str
    index: int


class NextAnnotationResponse(BaseModel):
    available: bool
    reason: str  # "available" | "none" (no data yet) | "done" (all annotated)
    total: int
    done: int
    remaining: int
    next: NextAnnotationItem | None = None


class AnnotationSubmit(BaseModel):
    text: str = Field(min_length=1)


class AnnotationSubmitResponse(BaseModel):
    ok: bool
    remaining: int


@router.post("", response_model=SampleCreateResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_sample(request: Request, body: SampleCreate, db: AsyncSession = Depends(get_db)):
    """Legacy endpoint to register a standalone sample (kept for existing dev data)."""
    user = await extract_user_from_request(request)
    request.state.user = user

    await storage.validate_key(body.image_key)
    if not await storage.object_exists(body.image_key):
        raise HTTPException(status_code=404, detail="Image object not found in storage")

    existing = await db.execute(select(Sample).where(Sample.image_key == body.image_key))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Sample already registered for this image")

    sample = Sample(
        image_key=body.image_key,
        expected_text=body.expected_text,
        ocr_text=body.ocr_text,
        lines=body.lines,
        source="generated",
    )
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    return SampleCreateResponse(sample_id=str(sample.id), image_key=sample.image_key)


@router.get("/next", response_model=NextAnnotationResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def next_annotation(
    request: Request,
    db: AsyncSession = Depends(get_db),
    exclude: str | None = Query(default=None, description="Comma-separated segment ids to skip"),
):
    user = await extract_user_from_request(request)
    request.state.user = user

    total = int((await db.execute(select(sa_func.count(Segment.id)))).scalar() or 0)
    done = int(
        (
            await db.execute(
                select(sa_func.count(Segment.id)).where(Segment.annotated_text.isnot(None))
            )
        ).scalar()
        or 0
    )
    remaining = total - done

    stmt = select(Segment).where(Segment.annotated_text.is_(None))
    if exclude:
        try:
            excluded_ids = [uuid.UUID(part.strip()) for part in exclude.split(",") if part.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid segment id in exclude")
        if excluded_ids:
            stmt = stmt.where(Segment.id.notin_(excluded_ids))
    stmt = stmt.order_by(sa_func.random()).limit(1)

    result = await db.execute(stmt)
    segment = result.scalar_one_or_none()
    if segment is None:
        reason = "none" if total == 0 else "done"
        return NextAnnotationResponse(
            available=False, reason=reason, total=total, done=done, remaining=remaining, next=None
        )

    image_url = await storage.presign_get(segment.image_key)
    return NextAnnotationResponse(
        available=True,
        reason="available",
        total=total,
        done=done,
        remaining=remaining,
        next=NextAnnotationItem(
            segment_id=str(segment.id),
            image_url=image_url,
            kind=segment.kind,
            index=segment.index,
        ),
    )


@router.post("/{segment_id}", response_model=AnnotationSubmitResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def submit_annotation(
    request: Request, segment_id: str, body: AnnotationSubmit, db: AsyncSession = Depends(get_db)
):
    user = await extract_user_from_request(request)
    request.state.user = user

    segment = await db.get(Segment, segment_id)
    if segment is None:
        raise HTTPException(status_code=404, detail="Segment not found")

    segment.annotated_text = body.text.strip()
    segment.annotated_at = sa_func.now()
    await db.commit()

    remaining = int(
        (
            await db.execute(
                select(sa_func.count(Segment.id)).where(Segment.annotated_text.is_(None))
            )
        ).scalar()
        or 0
    )
    return AnnotationSubmitResponse(ok=True, remaining=remaining)