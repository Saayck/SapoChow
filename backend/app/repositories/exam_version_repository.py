import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.exam_version import ExamVersion
from app.models.exam_version_question import ExamVersionQuestion
from app.models.exam_version_alternative import ExamVersionAlternative


class ExamVersionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_exam(self, exam_id: uuid.UUID) -> List[ExamVersion]:
        result = await self.db.execute(
            select(ExamVersion)
            .where(ExamVersion.exam_id == exam_id)
            .options(
                selectinload(ExamVersion.questions).selectinload(ExamVersionQuestion.alternatives)
            )
        )
        return list(result.scalars().all())

    async def get_by_id(self, version_id: uuid.UUID) -> Optional[ExamVersion]:
        result = await self.db.execute(
            select(ExamVersion)
            .where(ExamVersion.id == version_id)
            .options(
                selectinload(ExamVersion.questions).selectinload(ExamVersionQuestion.alternatives)
            )
        )
        return result.scalar_one_or_none()

    async def create(self, version: ExamVersion) -> ExamVersion:
        self.db.add(version)
        await self.db.flush()
        return version

    async def create_questions(self, questions: List[ExamVersionQuestion]) -> List[ExamVersionQuestion]:
        for q in questions:
            self.db.add(q)
        await self.db.flush()
        return questions

    async def create_alternatives(self, alternatives: List[ExamVersionAlternative]) -> None:
        for a in alternatives:
            self.db.add(a)
        await self.db.flush()

    async def update(self, version: ExamVersion) -> ExamVersion:
        await self.db.commit()
        await self.db.refresh(version)
        return version