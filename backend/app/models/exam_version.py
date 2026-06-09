import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database.base import Base
from app.enums import GenerationStatus
from app.models.exam import Exam

if TYPE_CHECKING:
    from app.models.exam_version_question import ExamVersionQuestion


class ExamVersion(Base):
    __tablename__ = "exam_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    version_label: Mapped[str] = mapped_column(String(50), nullable=False)
    answer_key: Mapped[Optional[dict]] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)
    latex_source: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    generation_status: Mapped[GenerationStatus] = mapped_column(SAEnum(GenerationStatus), default=GenerationStatus.PENDIENTE)
    generated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    exam: Mapped[Exam] = relationship("Exam", back_populates="versions")
    questions: Mapped[list] = relationship("ExamVersionQuestion", back_populates="version", cascade="all, delete-orphan")
