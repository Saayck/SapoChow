from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.exam_topic import ExamTopic


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    questions: Mapped[List["Question"]] = relationship("Question", back_populates="topic", cascade="all, delete-orphan")
    exam_topics: Mapped[List["ExamTopic"]] = relationship("ExamTopic", back_populates="topic")
