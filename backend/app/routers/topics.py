from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.topic import Topic
from app.models.question import Question
from app.schemas.topic import TopicCreate, TopicUpdate, TopicResponse
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.security import get_current_user

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get("", response_model=list[TopicResponse])
async def list_topics(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Topic, func.count(Question.id).label("question_count"))
        .outerjoin(Question, Question.topic_id == Topic.id)
        .group_by(Topic.id)
        .order_by(Topic.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = result.all()
    return [
        TopicResponse.model_validate(topic).model_copy(update={"question_count": count})
        for topic, count in rows
    ]


@router.post("", response_model=TopicResponse, status_code=201)
async def create_topic(
    data: TopicCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    topic = Topic(name=data.name, description=data.description)
    db.add(topic)
    await db.flush()
    await db.refresh(topic)
    return topic


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Topic, func.count(Question.id).label("question_count"))
        .outerjoin(Question, Question.topic_id == Topic.id)
        .where(Topic.id == topic_id)
        .group_by(Topic.id)
    )
    row = result.one_or_none()
    if not row:
        raise NotFoundError("Topic", topic_id)
    topic, count = row
    return TopicResponse.model_validate(topic).model_copy(update={"question_count": count})


@router.put("/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: int,
    data: TopicUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(topic, field, value)
    await db.flush()
    await db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=204)
async def delete_topic(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(Topic).where(Topic.id == topic_id).options(selectinload(Topic.questions))
    )
    topic = result.scalar_one_or_none()
    if not topic:
        raise NotFoundError("Topic", topic_id)
    if topic.questions:
        raise ValidationError(
            f"Cannot delete topic '{topic.name}': it has {len(topic.questions)} question(s). "
            "Delete or reassign questions first."
        )
    await db.delete(topic)
