import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TopicCreate(BaseModel):
    name: str
    description: Optional[str] = None


class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TopicResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
