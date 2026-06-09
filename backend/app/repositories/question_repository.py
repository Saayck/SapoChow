import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.question import Question, QuestionStatus


class QuestionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Question]:
        result = await self.db.execute(
            select(Question)
            .where(Question.deleted_at == None, Question.is_active == True)
            .options(selectinload(Question.alternatives))
        )
        return list(result.scalars().all())

    async def get_by_id(self, question_id: uuid.UUID) -> Optional[Question]:
        result = await self.db.execute(
            select(Question)
            .where(Question.id == question_id, Question.deleted_at == None)
            .options(selectinload(Question.alternatives))
        )
        return result.scalar_one_or_none()

    async def get_approved_by_topic(self, topic_id: uuid.UUID) -> List[Question]:
        result = await self.db.execute(
            select(Question)
            .where(
                Question.topic_id == topic_id,
                Question.status == QuestionStatus.APPROVED,
                Question.deleted_at == None,
                Question.is_active == True,
            )
            .options(selectinload(Question.alternatives))
        )
        return list(result.scalars().all())

    async def create(self, question: Question) -> Question:
        self.db.add(question)
        await self.db.commit()
        await self.db.refresh(question)
        return question

    async def update(self, question: Question) -> Question:
        await self.db.commit()
        await self.db.refresh(question)
        return question

    async def soft_delete(self, question: Question) -> None:
        question.deleted_at = datetime.utcnow()
        await self.db.commit()
