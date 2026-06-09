import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ExamConfigCreate(BaseModel):
    total_questions: int
    total_topics: int
    questions_per_topic: int
    versions_count: int = 1
    shuffle_questions: bool = True
    shuffle_alternatives: bool = True


class ExamTopicCreate(BaseModel):
    topic_id: uuid.UUID
    questions_count: int
    display_order: int = 0


class ExamCreate(BaseModel):
    title: str
    institution_name: Optional[str] = None
    institution_logo_url: Optional[str] = None
    course_name: Optional[str] = None
    professor_name: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = None
    header_latex: Optional[str] = None
    config: ExamConfigCreate
    topics: List[ExamTopicCreate]


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    institution_name: Optional[str] = None
    course_name: Optional[str] = None
    professor_name: Optional[str] = None
    instructions: Optional[str] = None
    duration_minutes: Optional[int] = None


class ExamConfigResponse(BaseModel):
    id: uuid.UUID
    total_questions: int
    total_topics: int
    questions_per_topic: int
    versions_count: int
    shuffle_questions: bool
    shuffle_alternatives: bool

    model_config = {"from_attributes": True}


class ExamTopicResponse(BaseModel):
    id: uuid.UUID
    topic_id: uuid.UUID
    questions_count: int
    display_order: int

    model_config = {"from_attributes": True}


class ExamResponse(BaseModel):
    id: uuid.UUID
    title: str
    institution_name: Optional[str]
    course_name: Optional[str]
    professor_name: Optional[str]
    instructions: Optional[str]
    duration_minutes: Optional[int]
    is_active: bool
    created_at: datetime
    config: Optional[ExamConfigResponse]
    topics: List[ExamTopicResponse] = []

    model_config = {"from_attributes": True}
