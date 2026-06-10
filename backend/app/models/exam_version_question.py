from typing import TYPE_CHECKING, List
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.exam_version import ExamVersion
    from app.models.question import Question
    from app.models.exam_version_alternative import ExamVersionAlternative


class ExamVersionQuestion(Base):
    __tablename__ = "exam_version_questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_version_id: Mapped[int] = mapped_column(ForeignKey("exam_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    order_number: Mapped[int] = mapped_column(Integer, nullable=False)
    topic_order: Mapped[int] = mapped_column(Integer, nullable=False)

    exam_version: Mapped["ExamVersion"] = relationship("ExamVersion", back_populates="version_questions")
    question: Mapped["Question"] = relationship("Question")
    version_alternatives: Mapped[List["ExamVersionAlternative"]] = relationship(
        "ExamVersionAlternative", back_populates="exam_version_question",
        cascade="all, delete-orphan",
        order_by="ExamVersionAlternative.order_number"
    )
