import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base


class ExamConfig(Base):
    __tablename__ = "exam_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, unique=True)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    total_topics: Mapped[int] = mapped_column(Integer, nullable=False)
    questions_per_topic: Mapped[int] = mapped_column(Integer, nullable=False)
    versions_count: Mapped[int] = mapped_column(Integer, default=1)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, default=True)
    shuffle_alternatives: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="config")
