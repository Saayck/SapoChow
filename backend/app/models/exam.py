from datetime import datetime, date
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Text, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.exam_config import ExamConfig
    from app.models.exam_topic import ExamTopic
    from app.models.exam_version import ExamVersion


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    institution_name: Mapped[str] = mapped_column(String(500), nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(255), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    config: Mapped["ExamConfig"] = relationship("ExamConfig", back_populates="exam", uselist=False, cascade="all, delete-orphan")
    exam_topics: Mapped[List["ExamTopic"]] = relationship("ExamTopic", back_populates="exam", cascade="all, delete-orphan")
    versions: Mapped[List["ExamVersion"]] = relationship("ExamVersion", back_populates="exam", cascade="all, delete-orphan")
