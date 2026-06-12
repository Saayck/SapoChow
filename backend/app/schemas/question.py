from datetime import datetime
from pydantic import BaseModel, model_validator, field_validator
from app.schemas.alternative import AlternativeCreate, AlternativeResponse


class QuestionCreate(BaseModel):
    topic_id: int
    statement_text: str | None = None
    statement_latex: str | None = None
    image_path: str | None = None
    alternatives: list[AlternativeCreate]

    @model_validator(mode="after")
    def validate_question(self) -> "QuestionCreate":
        if not self.statement_text and not self.statement_latex and not self.image_path:
            raise ValueError("Question must have statement_text, statement_latex, or image_path")
        if len(self.alternatives) != 5:
            raise ValueError(f"Question must have exactly 5 alternatives, got {len(self.alternatives)}")
        correct_count = sum(1 for a in self.alternatives if a.is_correct)
        if correct_count != 1:
            raise ValueError(f"Question must have exactly 1 correct alternative, got {correct_count}")
        return self


class QuestionUpdate(BaseModel):
    topic_id: int | None = None
    statement_text: str | None = None
    statement_latex: str | None = None
    image_path: str | None = None
    alternatives: list[AlternativeCreate] | None = None

    @model_validator(mode="after")
    def validate_alternatives(self) -> "QuestionUpdate":
        if self.alternatives is not None:
            if len(self.alternatives) != 5:
                raise ValueError(f"Question must have exactly 5 alternatives, got {len(self.alternatives)}")
            correct_count = sum(1 for a in self.alternatives if a.is_correct)
            if correct_count != 1:
                raise ValueError(f"Question must have exactly 1 correct alternative, got {correct_count}")
        return self


class QuestionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    topic_id: int
    statement_text: str | None
    statement_latex: str | None
    image_path: str | None
    created_at: datetime
    alternatives: list[AlternativeResponse] = []


class ImportedAlternativePreview(BaseModel):
    content_text: str | None = None
    content_latex: str | None = None
    is_correct: bool = False


class ImportedQuestionPreview(BaseModel):
    statement_text: str | None = None
    statement_latex: str | None = None
    alternatives: list[ImportedAlternativePreview] = []
    warnings: list[str] = []


class QuestionImportPreview(BaseModel):
    file_name: str
    detected_questions: list[ImportedQuestionPreview]
    warnings: list[str] = []


class QuestionImportConfirm(BaseModel):
    topic_id: int
    questions: list[ImportedQuestionPreview]
