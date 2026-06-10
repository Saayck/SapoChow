from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.exam_version_question import ExamVersionQuestion
    from app.models.alternative import Alternative


class ExamVersionAlternative(Base):
    __tablename__ = "exam_version_alternatives"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_version_question_id: Mapped[int] = mapped_column(
        ForeignKey("exam_version_questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    alternative_id: Mapped[int] = mapped_column(ForeignKey("alternatives.id", ondelete="CASCADE"), nullable=False)
    letter: Mapped[str] = mapped_column(String(1), nullable=False)
    order_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct_snapshot: Mapped[bool] = mapped_column(Boolean, nullable=False)

    exam_version_question: Mapped["ExamVersionQuestion"] = relationship(
        "ExamVersionQuestion", back_populates="version_alternatives"
    )
    alternative: Mapped["Alternative"] = relationship("Alternative")
