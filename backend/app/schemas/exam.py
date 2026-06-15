from datetime import datetime, date
from pydantic import BaseModel, model_validator, field_validator


class ExamConfigCreate(BaseModel):
    total_questions: int
    total_topics: int
    questions_per_topic: int
    version_count: int

    @model_validator(mode="after")
    def validate_config(self) -> "ExamConfigCreate":
        if self.total_questions <= 0:
            raise ValueError("total_questions must be greater than 0")
        if self.total_topics <= 0:
            raise ValueError("total_topics must be greater than 0")
        if self.questions_per_topic <= 0:
            raise ValueError("questions_per_topic must be greater than 0")
        if self.version_count <= 0:
            raise ValueError("version_count must be greater than 0")
        if self.total_questions != self.total_topics * self.questions_per_topic:
            raise ValueError(
                f"total_questions ({self.total_questions}) must equal "
                f"total_topics ({self.total_topics}) × questions_per_topic ({self.questions_per_topic})"
            )
        return self


class ExamTopicCreate(BaseModel):
    topic_id: int
    questions_count: int

    @field_validator("questions_count")
    @classmethod
    def questions_count_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("questions_count must be greater than 0")
        return v


class ExamCreate(BaseModel):
    title: str
    institution_name: str
    teacher_name: str
    exam_date: date
    instructions: str | None = None
    config: ExamConfigCreate
    topics: list[ExamTopicCreate]

    @model_validator(mode="after")
    def validate_exam(self) -> "ExamCreate":
        if not self.title.strip():
            raise ValueError("title cannot be empty")
        if len(self.topics) != self.config.total_topics:
            raise ValueError(
                f"Number of topics ({len(self.topics)}) must match total_topics ({self.config.total_topics})"
            )
        for t in self.topics:
            if t.questions_count != self.config.questions_per_topic:
                raise ValueError(
                    f"Each topic must contribute exactly {self.config.questions_per_topic} questions, "
                    f"but topic_id={t.topic_id} has {t.questions_count}"
                )
        return self


class ExamUpdate(BaseModel):
    title: str | None = None
    institution_name: str | None = None
    teacher_name: str | None = None
    exam_date: date | None = None
    instructions: str | None = None


class ExamConfigUpdate(BaseModel):
    total_questions: int
    total_topics: int
    questions_per_topic: int
    version_count: int

    @model_validator(mode="after")
    def validate_config(self) -> "ExamConfigUpdate":
        if self.total_questions <= 0:
            raise ValueError("total_questions must be greater than 0")
        if self.total_topics <= 0:
            raise ValueError("total_topics must be greater than 0")
        if self.questions_per_topic <= 0:
            raise ValueError("questions_per_topic must be greater than 0")
        if self.version_count <= 0:
            raise ValueError("version_count must be greater than 0")
        if self.total_questions != self.total_topics * self.questions_per_topic:
            raise ValueError(
                f"total_questions ({self.total_questions}) must equal "
                f"total_topics ({self.total_topics}) × questions_per_topic ({self.questions_per_topic})"
            )
        return self


class ExamTopicsUpdate(BaseModel):
    topics: list[ExamTopicCreate]


class ExamConfigResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    exam_id: int
    total_questions: int
    total_topics: int
    questions_per_topic: int
    version_count: int


class ExamTopicResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    exam_id: int
    topic_id: int
    questions_count: int


class ExamResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    title: str
    institution_name: str
    teacher_name: str
    exam_date: date
    instructions: str | None
    created_at: datetime
    config: ExamConfigResponse | None = None
    exam_topics: list[ExamTopicResponse] = []
