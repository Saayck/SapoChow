import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.import_job import ImportJob


class ImportJobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[ImportJob]:
        result = await self.db.execute(select(ImportJob).order_by(ImportJob.created_at.desc()))
        return list(result.scalars().all())

    async def get_by_id(self, job_id: uuid.UUID) -> Optional[ImportJob]:
        result = await self.db.execute(select(ImportJob).where(ImportJob.id == job_id))
        return result.scalar_one_or_none()

    async def create(self, job: ImportJob) -> ImportJob:
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def update(self, job: ImportJob) -> ImportJob:
        await self.db.commit()
        await self.db.refresh(job)
        return job