import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.version_schema import ExamVersionResponse, AnswerKeyResponse, GenerateVersionsRequest, PDFStatusResponse
from app.services.exam_version_service import ExamVersionService
from app.services.pdf_service import PDFService
from app.core.exceptions import NotFoundException

router = APIRouter(tags=["versions"])


@router.post("/api/exams/{exam_id}/versions", response_model=List[ExamVersionResponse], status_code=201)
async def generate_versions(
    exam_id: uuid.UUID,
    data: GenerateVersionsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ExamVersionService(db).generate(exam_id, data, user)


@router.get("/api/exams/{exam_id}/versions", response_model=List[ExamVersionResponse])
async def list_versions(
    exam_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await ExamVersionService(db).get_by_exam(exam_id)


@router.get("/api/versions/{version_id}", response_model=ExamVersionResponse)
async def get_version(
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await ExamVersionService(db).get_by_id(version_id)


@router.get("/api/versions/{version_id}/answer-key", response_model=AnswerKeyResponse)
async def get_answer_key(
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await ExamVersionService(db).get_answer_key(version_id)


@router.post("/api/versions/{version_id}/pdf", response_model=PDFStatusResponse, status_code=202)
async def generate_pdf(
    version_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Dispara la generación del PDF en background y retorna estado inmediato."""
    svc = PDFService(db)
    existing = svc.get_pdf_path(version_id)
    if existing:
        return PDFStatusResponse(version_id=version_id, ready=True, pdf_url=f"/api/versions/{version_id}/pdf/download")

    background_tasks.add_task(svc.generate, version_id)
    return PDFStatusResponse(version_id=version_id, ready=False, pdf_url=None)


@router.get("/api/versions/{version_id}/pdf/download")
async def download_pdf(
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Descarga el PDF generado para la versión indicada. Si no existe, lo genera al momento."""
    svc = PDFService(db)
    path = svc.get_pdf_path(version_id)
    if not path:
        path = await svc.generate(version_id)

    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename=f"version_{version_id}.pdf",
    )
