import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AlternativeCreate(BaseModel):
    content: str
    latex_content: Optional[str] = None
    image_url: Optional[str] = None
    is_correct: bool = False
    default_order: int = 0


class AlternativeResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    content: str
    latex_content: Optional[str]
    image_url: Optional[str]
    is_correct: bool
    default_order: int
    created_at: datetime

    model_config = {"from_attributes": True}
