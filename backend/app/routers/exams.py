from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.services.exam_service import create_exam, get_exam, list_exams, update_exam, delete_exam
from app.utils.security import get_current_user

router = APIRouter(prefix="/exams", tags=["Exams"])


@router.get("", response_model=list[ExamResponse])
async def list_exams_endpoint(db: AsyncSession = Depends(get_db)):
    return await list_exams(db)


@router.post("", response_model=ExamResponse, status_code=201)
async def create_exam_endpoint(
    data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    exam = await create_exam(data, db)
    return await get_exam(exam.id, db)


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam_endpoint(exam_id: int, db: AsyncSession = Depends(get_db)):
    return await get_exam(exam_id, db)


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam_endpoint(
    exam_id: int,
    data: ExamUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await update_exam(exam_id, data, db)


@router.delete("/{exam_id}", status_code=204)
async def delete_exam_endpoint(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    await delete_exam(exam_id, db)
