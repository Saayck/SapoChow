import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base
from app.models.exam_version import ExamVersion
from app.models.question import Question

if TYPE_CHECKING:
    from app.models.exam_version_alternative import ExamVersionAlternative


class ExamVersionQuestion(Base):
    __tablename__ = "exam_version_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_versions.id"), nullable=False)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    topic_block: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_letter: Mapped[str] = mapped_column(String(1), nullable=False)

    version: Mapped[ExamVersion] = relationship("ExamVersion", back_populates="questions")
    question: Mapped[Question] = relationship("Question")
    alternatives: Mapped[list] = relationship("ExamVersionAlternative", back_populates="evq", cascade="all, delete-orphan")