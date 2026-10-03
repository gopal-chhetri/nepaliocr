import uuid
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.models.user import Base


class Document(Base):
    """A data-collection source image (handwritten photo or AI-rendered text)."""

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_key = Column(String(255), nullable=False, index=True)
    section = Column(String(16), nullable=False)
    source = Column(String(32), nullable=False, default="handwritten")
    expected_text = Column(Text, nullable=True)
    lines_requested = Column(Integer, default=0)
    lines_found = Column(Integer, nullable=True)
    status = Column(String(16), nullable=False, default="pending")
    error = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    segmented_at = Column(DateTime(timezone=True), nullable=True)


class Segment(Base):
    """A single annotatable crop (line or word) of a Document."""

    __tablename__ = "segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind = Column(String(16), nullable=False, default="line")
    index = Column(Integer, nullable=False)
    image_key = Column(String(255), nullable=False)
    bbox = Column(JSONB, nullable=True)
    expected_text = Column(Text, nullable=True)
    annotated_text = Column(Text, nullable=True)
    annotated_at = Column(DateTime(timezone=True), nullable=True)
    annotated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_extra = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def is_annotated(self) -> bool:
        return bool(self.annotated_text and self.annotated_text.strip())