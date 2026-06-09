import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.uploaded_file import UploadedFile


class FileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, file_id: uuid.UUID) -> Optional[UploadedFile]:
        result = await self.db.execute(select(UploadedFile).where(UploadedFile.id == file_id))
        return result.scalar_one_or_none()

    async def create(self, file: UploadedFile) -> UploadedFile:
        self.db.add(file)
        await self.db.commit()
        await self.db.refresh(file)
        return file
