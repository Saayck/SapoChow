import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.import_job import ImportJob, ImportStatus
from app.models.user import User
from app.repositories.import_job_repository import ImportJobRepository
from app.schemas.import_schema import ImportJobResponse


class ImportService:
    def __init__(self, db: AsyncSession):
        self.repo = ImportJobRepository(db)

    async def get_all(self) -> List[ImportJobResponse]:
        jobs = await self.repo.get_all()
        return [ImportJobResponse.model_validate(j) for j in jobs]

    async def get_by_id(self, job_id: uuid.UUID) -> ImportJobResponse:
        job = await self.repo.get_by_id(job_id)
        if not job:
            raise NotFoundException("Import job not found")
        return ImportJobResponse.model_validate(job)

    async def create_job(self, filename: str, file_type: str, current_user: User) -> ImportJobResponse:
        """
        Registra un nuevo job de importación en estado PENDING.
        El parseo real del archivo ocurre de forma asíncrona (futura tarea en background).
        """
        job = ImportJob(
            id=uuid.uuid4(),
            filename=filename,
            file_type=file_type,
            status=ImportStatus.PENDING,
            uploaded_by=current_user.id,
        )
        created = await self.repo.create(job)
        return ImportJobResponse.model_validate(created)
