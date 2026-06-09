import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base


class ExamTopic(Base):
    __tablename__ = "exam_topics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    questions_count: Mapped[int] = mapped_column(Integer, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="topics")
    topic: Mapped["Topic"] = relationship("Topic")
