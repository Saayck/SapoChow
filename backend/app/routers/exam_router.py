import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.exam_schema import ExamCreate, ExamUpdate, ExamResponse
from app.services.exam_service import ExamService

router = APIRouter(prefix="/api/exams", tags=["exams"])


@router.get("", response_model=List[ExamResponse])
async def list_exams(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await ExamService(db).get_all()


@router.post("", response_model=ExamResponse, status_code=201)
async def create_exam(data: ExamCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ExamService(db).create(data, user)


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await ExamService(db).get_by_id(exam_id)


@router.put("/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: uuid.UUID, data: ExamUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await ExamService(db).update(exam_id, data)


@router.delete("/{exam_id}", status_code=204)
async def delete_exam(exam_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    await ExamService(db).delete(exam_id)