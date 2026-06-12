from datetime import datetime
from pydantic import BaseModel, field_validator


class TopicCreate(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name cannot be empty")
        return v.strip()


class TopicUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("name cannot be empty")
        return v.strip() if v else v


class TopicResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    created_at: datetime
    question_count: int = 0
