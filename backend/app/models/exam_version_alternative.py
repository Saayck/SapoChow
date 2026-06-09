import uuid
from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base
from app.models.exam_version_question import ExamVersionQuestion
from app.models.alternative import Alternative


class ExamVersionAlternative(Base):
    __tablename__ = "exam_version_alternatives"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evq_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_version_questions.id"), nullable=False)
    alternative_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alternatives.id"), nullable=False)
    assigned_letter: Mapped[str] = mapped_column(String(1), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    evq: Mapped[ExamVersionQuestion] = relationship("ExamVersionQuestion", back_populates="alternatives")
    alternative: Mapped[Alternative] = relationship("Alternative")