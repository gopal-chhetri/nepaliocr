import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.params import Depends
from app.core.rate_limit import limiter

from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document, Segment
from app.services import storage
from app.jobs import enqueue_segmentation
from app.services.auth.jwt_handler import extract_user_from_request

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contributions", tags=["contributions"])



class ContributionCreate(BaseModel):
    image_key: str = Field(min_length=1, max_length=255)
    source: str = Field(pattern="^(handwritten|ai)$")
    expected_lines: list[str] = Field(default_factory=list, max_length=20)


class ContributionCreated(BaseModel):
    id: str
    status: str


class SegmentDto(BaseModel):
    id: str
    index: int
    image_key: str
    image_url: str
    expected_text: str | None
    is_extra: bool
    annotated: bool


class ContributionDto(BaseModel):
    id: str
    image_key: str
    section: str
    source: str
    status: str
    error: str | None
    lines_requested: int
    lines_found: int | None
    created_at: str
    segments: list[SegmentDto]


class ContributionListItem(BaseModel):
    id: str
    source: str
    status: str
    lines_requested: int
    lines_found: int | None
    created_at: str


async def _segment_dto(segment: Segment) -> SegmentDto:
    image_url = await storage.presign_get(segment.image_key)
    return SegmentDto(
        id=str(segment.id),
        index=segment.index,
        image_key=segment.image_key,
        image_url=image_url,
        expected_text=segment.expected_text,
        is_extra=segment.is_extra,
        annotated=segment.is_annotated,
    )


@router.post("", response_model=ContributionCreated, status_code=202)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_contribution(
    request: Request, body: ContributionCreate, db: AsyncSession = Depends(get_db)
):
    user = await extract_user_from_request(request)
    request.state.user = user

    if not body.image_key.startswith(("uploads/", "rendered/")):
        raise HTTPException(status_code=400, detail="image_key must live under 'uploads/' or 'rendered/'")

    if not await storage.object_exists(body.image_key):
        raise HTTPException(status_code=404, detail="Image object not found in storage")

    existing = await db.execute(select(Document).where(Document.image_key == body.image_key))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="A document already exists for this image")

    section = body.image_key.split("/")[0]
    document = Document(
        image_key=body.image_key,
        section=section,
        source=body.source,
        expected_text="\n".join(body.expected_lines),
        lines_requested=len(body.expected_lines),
        status="pending",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    await enqueue_segmentation(document.id)
    return ContributionCreated(id=str(document.id), status=document.status)


@router.get("", response_model=list[ContributionListItem])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def list_contributions(request: Request, db: AsyncSession = Depends(get_db)):
    await extract_user_from_request(request)
    result = await db.execute(select(Document).order_by(desc(Document.created_at)).limit(20))
    return [
        ContributionListItem(
            id=str(d.id),
            source=d.source,
            status=d.status,
            lines_requested=d.lines_requested,
            lines_found=d.lines_found,
            created_at=d.created_at.isoformat(),
        )
        for d in result.scalars()
    ]


@router.get("/{document_id}", response_model=ContributionDto)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def get_contribution(request: Request, document_id: str, db: AsyncSession = Depends(get_db)):
    await extract_user_from_request(request)
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Contribution not found")

    segs = await db.execute(
        select(Segment).where(Segment.document_id == document.id).order_by(Segment.index.asc())
    )
    segments = [await _segment_dto(s) for s in segs.scalars().all()]
    return ContributionDto(
        id=str(document.id),
        image_key=document.image_key,
        section=document.section,
        source=document.source,
        status=document.status,
        error=document.error,
        lines_requested=document.lines_requested,
        lines_found=document.lines_found,
        created_at=document.created_at.isoformat(),
        segments=segments,
    )


@router.get("/{document_id}/segments", response_model=list[SegmentDto])
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def get_segments(request: Request, document_id: str, db: AsyncSession = Depends(get_db)):
    await extract_user_from_request(request)
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Contribution not found")

    segs = await db.execute(
        select(Segment).where(Segment.document_id == document.id).order_by(Segment.index.asc())
    )
    return [await _segment_dto(s) for s in segs.scalars().all()]