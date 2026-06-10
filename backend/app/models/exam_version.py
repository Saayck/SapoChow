from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.exam_version_question import ExamVersionQuestion


class ExamVersion(Base):
    __tablename__ = "exam_versions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    version_code: Mapped[str] = mapped_column(String(10), nullable=False)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="versions")
    version_questions: Mapped[List["ExamVersionQuestion"]] = relationship(
        "ExamVersionQuestion", back_populates="exam_version", cascade="all, delete-orphan",
        order_by="ExamVersionQuestion.order_number"
    )
