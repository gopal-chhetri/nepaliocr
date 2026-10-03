import uuid

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.user import Base


class Sample(Base):
    __tablename__ = "samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_key = Column(String(255), unique=True, nullable=False)
    expected_text = Column(Text, nullable=True)
    annotated_text = Column(Text, nullable=True)
    ocr_text = Column(Text, nullable=True)
    lines = Column(Integer, nullable=True)
    source = Column(String(32), default="generated", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    annotated_at = Column(DateTime(timezone=True), nullable=True)

    @property
    def is_annotated(self) -> bool:
        return bool(self.annotated_text and self.annotated_text.strip())