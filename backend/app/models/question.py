import uuid
import enum
from datetime import datetime
from app.utils import utcnow
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Float, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base
from app.models.topic import Topic


class QuestionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    latex_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    points: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[QuestionStatus] = mapped_column(SAEnum(QuestionStatus), default=QuestionStatus.DRAFT)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    topic: Mapped[Topic] = relationship("Topic", back_populates="questions")
    alternatives: Mapped[list] = relationship("Alternative", back_populates="question", cascade="all, delete-orphan")
