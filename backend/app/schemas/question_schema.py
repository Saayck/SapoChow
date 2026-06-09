import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.question import QuestionStatus
from app.schemas.alternative_schema import AlternativeCreate, AlternativeResponse


class QuestionCreate(BaseModel):
    topic_id: uuid.UUID
    statement: str
    latex_content: Optional[str] = None
    image_url: Optional[str] = None
    points: float = 1.0
    alternatives: List[AlternativeCreate]


class QuestionUpdate(BaseModel):
    statement: Optional[str] = None
    latex_content: Optional[str] = None
    image_url: Optional[str] = None
    points: Optional[float] = None


class QuestionResponse(BaseModel):
    id: uuid.UUID
    topic_id: uuid.UUID
    statement: str
    latex_content: Optional[str]
    image_url: Optional[str]
    points: float
    status: QuestionStatus
    is_active: bool
    created_at: datetime
    alternatives: List[AlternativeResponse] = []

    model_config = {"from_attributes": True}
