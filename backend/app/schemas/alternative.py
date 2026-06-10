from datetime import datetime
from pydantic import BaseModel, model_validator


class AlternativeCreate(BaseModel):
    content_text: str | None = None
    content_latex: str | None = None
    image_path: str | None = None
    is_correct: bool = False

    @model_validator(mode="after")
    def has_content(self) -> "AlternativeCreate":
        if not self.content_text and not self.content_latex and not self.image_path:
            raise ValueError("Alternative must have content_text, content_latex, or image_path")
        return self


class AlternativeUpdate(BaseModel):
    content_text: str | None = None
    content_latex: str | None = None
    image_path: str | None = None
    is_correct: bool | None = None


class AlternativeResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    question_id: int
    content_text: str | None
    content_latex: str | None
    image_path: str | None
    is_correct: bool
    created_at: datetime
