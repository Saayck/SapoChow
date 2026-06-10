from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.exam import Exam


class ExamConfig(Base):
    __tablename__ = "exam_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    total_topics: Mapped[int] = mapped_column(Integer, nullable=False)
    questions_per_topic: Mapped[int] = mapped_column(Integer, nullable=False)
    version_count: Mapped[int] = mapped_column(Integer, nullable=False)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="config")
