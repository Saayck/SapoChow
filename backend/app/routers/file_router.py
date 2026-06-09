import uuid
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.file_schema import FileResponse
from app.services.file_service import FileService

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload", response_model=FileResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await FileService(db).upload(file, user)


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(file_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await FileService(db).get_by_id(file_id)