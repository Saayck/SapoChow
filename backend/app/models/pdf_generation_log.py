import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database.base import Base


class PDFLogStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PDFGenerationLog(Base):
    __tablename__ = "pdf_generation_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("exam_versions.id"), nullable=False)
    status: Mapped[PDFLogStatus] = mapped_column(SAEnum(PDFLogStatus), default=PDFLogStatus.PENDING)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
