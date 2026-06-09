import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database.base import Base


class GenerationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ExamVersion(Base):
    __tablename__ = "exam_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    version_label: Mapped[str] = mapped_column(String(50), nullable=False)
    answer_key: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    latex_source: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    generation_status: Mapped[GenerationStatus] = mapped_column(SAEnum(GenerationStatus), default=GenerationStatus.PENDING)
    generated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="versions")
    questions: Mapped[list] = relationship("ExamVersionQuestion", back_populates="version", cascade="all, delete-orphan")
