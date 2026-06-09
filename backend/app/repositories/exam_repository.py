import uuid
from app.utils import utcnow
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.exam import Exam
from app.models.exam_config import ExamConfig
from app.models.exam_topic import ExamTopic


class ExamRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Exam]:
        result = await self.db.execute(
            select(Exam)
            .where(Exam.deleted_at == None, Exam.is_active == True)
            .options(selectinload(Exam.config), selectinload(Exam.topics))
        )
        return list(result.scalars().all())

    async def get_by_id(self, exam_id: uuid.UUID) -> Optional[Exam]:
        result = await self.db.execute(
            select(Exam)
            .where(Exam.id == exam_id, Exam.deleted_at == None)
            .options(selectinload(Exam.config), selectinload(Exam.topics))
        )
        return result.scalar_one_or_none()

    async def create(self, exam: Exam) -> Exam:
        self.db.add(exam)
        await self.db.commit()
        await self.db.refresh(exam)
        return exam

    async def create_config(self, config: ExamConfig) -> ExamConfig:
        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)
        return config

    async def create_topics(self, topics: List[ExamTopic]) -> None:
        for t in topics:
            self.db.add(t)
        await self.db.commit()

    async def update(self, exam: Exam) -> Exam:
        await self.db.commit()
        await self.db.refresh(exam)
        return exam

    async def soft_delete(self, exam: Exam) -> None:
        exam.deleted_at = utcnow()
        await self.db.commit()