import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.topic_schema import TopicCreate, TopicUpdate, TopicResponse
from app.services.topic_service import TopicService

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("", response_model=List[TopicResponse])
async def list_topics(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await TopicService(db).get_all()


@router.post("", response_model=TopicResponse, status_code=201)
async def create_topic(data: TopicCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await TopicService(db).create(data, user)


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await TopicService(db).get_by_id(topic_id)


@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(topic_id: uuid.UUID, data: TopicUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await TopicService(db).update(topic_id, data)


@router.delete("/{topic_id}", status_code=204)
async def delete_topic(topic_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    await TopicService(db).delete(topic_id)