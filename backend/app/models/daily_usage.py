import uuid
from sqlalchemy import Column, String, Integer, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.user import Base


class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    ip = Column(String(45), index=True, nullable=False)
    date = Column(Date, nullable=False)
    count = Column(Integer, default=0)