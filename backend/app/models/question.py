from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.topic import Topic
    from app.models.alternative import Alternative


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    statement_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    statement_latex: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    topic: Mapped["Topic"] = relationship("Topic", back_populates="questions")
    alternatives: Mapped[List["Alternative"]] = relationship(
        "Alternative", back_populates="question", cascade="all, delete-orphan"
    )
