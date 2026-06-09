import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.import_schema import ImportJobResponse
from app.services.import_service import ImportService

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/questions", response_model=ImportJobResponse, status_code=201)
async def import_questions(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filename = file.filename or "unknown"
    file_type = filename.rsplit(".", 1)[-1].lower() if "." in filename else "unknown"
    return await ImportService(db).create_job(filename, file_type, user)


@router.get("/jobs", response_model=List[ImportJobResponse])
async def list_jobs(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await ImportService(db).get_all()


@router.get("/jobs/{job_id}", response_model=ImportJobResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await ImportService(db).get_by_id(job_id)