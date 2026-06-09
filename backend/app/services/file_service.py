import uuid
import os
import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.repositories.file_repository import FileRepository
from app.schemas.file_schema import FileResponse

ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class FileService:
    def __init__(self, db: AsyncSession):
        self.repo = FileRepository(db)

    async def upload(self, file: UploadFile, current_user: User) -> FileResponse:
        """
        Guarda un archivo subido en disco y registra sus metadatos en la BD.
        Valida el MIME type contra una lista de permitidos y aplica un límite de 10 MB.
        El archivo se almacena con un nombre prefijado por UUID para evitar colisiones.
        """
        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise BadRequestException("File exceeds the 10 MB size limit")

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise BadRequestException(f"File type '{file.content_type}' is not allowed")

        stored_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        uploaded = UploadedFile(
            id=uuid.uuid4(),
            original_name=file.filename,
            stored_name=stored_name,
            file_path=file_path,
            mime_type=file.content_type,
            size_bytes=len(content),
            uploaded_by=current_user.id,
        )
        created = await self.repo.create(uploaded)
        return FileResponse.model_validate(created)

    async def get_by_id(self, file_id: uuid.UUID) -> FileResponse:
        file = await self.repo.get_by_id(file_id)
        if not file:
            raise NotFoundException("File not found")
        return FileResponse.model_validate(file)
