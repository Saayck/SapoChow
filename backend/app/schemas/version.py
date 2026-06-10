from datetime import datetime
from pydantic import BaseModel, field_validator


class GenerateVersionsRequest(BaseModel):
    seed: int | None = None


class ExamVersionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    exam_id: int
    version_code: str
    pdf_path: str | None
    created_at: datetime


class VersionPreviewAlternative(BaseModel):
    letter: str
    content_text: str | None
    content_latex: str | None
    image_path: str | None
    is_correct: bool


class VersionPreviewQuestion(BaseModel):
    number: int
    statement_text: str | None
    statement_latex: str | None
    image_path: str | None
    topic_order: int
    alternatives: list[VersionPreviewAlternative]


class VersionPreviewResponse(BaseModel):
    version_id: int
    version_code: str
    exam: dict
    questions: list[VersionPreviewQuestion]


class AnswerKeyItem(BaseModel):
    question_number: int
    correct_letter: str


class AnswerKeyResponse(BaseModel):
    version_code: str
    answers: list[AnswerKeyItem]


class GeneratedVersionItem(BaseModel):
    id: int
    version_code: str


class GenerateVersionsResponse(BaseModel):
    exam_id: int
    generated_versions: list[GeneratedVersionItem]
