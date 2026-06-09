import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.question_schema import QuestionCreate, QuestionUpdate, QuestionResponse
from app.services.question_service import QuestionService

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("", response_model=List[QuestionResponse])
async def list_questions(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await QuestionService(db).get_all()


@router.post("", response_model=QuestionResponse, status_code=201)
async def create_question(data: QuestionCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await QuestionService(db).create(data, user)


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await QuestionService(db).get_by_id(question_id)


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(question_id: uuid.UUID, data: QuestionUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await QuestionService(db).update(question_id, data)


@router.delete("/{question_id}", status_code=204)
async def delete_question(question_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    await QuestionService(db).delete(question_id)


@router.post("/{question_id}/approve", response_model=QuestionResponse)
async def approve_question(question_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    return await QuestionService(db).approve(question_id)


@router.post("/{question_id}/reject", response_model=QuestionResponse)
async def reject_question(question_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    return await QuestionService(db).reject(question_id)
