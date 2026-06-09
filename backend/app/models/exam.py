import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    institution_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    institution_logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    course_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    professor_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    header_latex: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    config: Mapped[Optional["ExamConfig"]] = relationship("ExamConfig", back_populates="exam", uselist=False)
    topics: Mapped[list] = relationship("ExamTopic", back_populates="exam")
    versions: Mapped[list] = relationship("ExamVersion", back_populates="exam")
