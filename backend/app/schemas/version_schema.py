import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from app.models.exam_version import GenerationStatus


class GenerateVersionsRequest(BaseModel):
    count: Optional[int] = None


class VersionAlternativeResponse(BaseModel):
    id: uuid.UUID
    alternative_id: uuid.UUID
    assigned_letter: str
    position: int

    model_config = {"from_attributes": True}


class VersionQuestionResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    position: int
    topic_block: int
    correct_letter: str
    alternatives: List[VersionAlternativeResponse] = []

    model_config = {"from_attributes": True}


class ExamVersionResponse(BaseModel):
    id: uuid.UUID
    exam_id: uuid.UUID
    version_label: str
    generation_status: GenerationStatus
    generated_at: Optional[datetime]
    questions: List[VersionQuestionResponse] = []

    model_config = {"from_attributes": True}


class AnswerKeyResponse(BaseModel):
    version_id: uuid.UUID
    version_label: str
    answer_key: Dict[str, Any]


class PDFStatusResponse(BaseModel):
    version_id: uuid.UUID
    ready: bool
    pdf_url: Optional[str] = None
