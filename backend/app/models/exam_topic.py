from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.exam import Exam
    from app.models.topic import Topic


class ExamTopic(Base):
    __tablename__ = "exam_topics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    questions_count: Mapped[int] = mapped_column(Integer, nullable=False)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="exam_topics")
    topic: Mapped["Topic"] = relationship("Topic", back_populates="exam_topics")
