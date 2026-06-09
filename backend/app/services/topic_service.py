import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.topic import Topic
from app.models.user import User
from app.repositories.topic_repository import TopicRepository
from app.schemas.topic_schema import TopicCreate, TopicUpdate, TopicResponse


class TopicService:
    def __init__(self, db: AsyncSession):
        self.repo = TopicRepository(db)

    async def get_all(self) -> List[TopicResponse]:
        topics = await self.repo.get_all()
        return [TopicResponse.model_validate(t) for t in topics]

    async def get_by_id(self, topic_id: uuid.UUID) -> TopicResponse:
        topic = await self.repo.get_by_id(topic_id)
        if not topic:
            raise NotFoundException("Tema no encontrado")
        return TopicResponse.model_validate(topic)

    async def create(self, data: TopicCreate, current_user: User) -> TopicResponse:
        topic = Topic(id=uuid.uuid4(), created_by=current_user.id, **data.model_dump())
        created = await self.repo.create(topic)
        return TopicResponse.model_validate(created)

    async def update(self, topic_id: uuid.UUID, data: TopicUpdate) -> TopicResponse:
        topic = await self.repo.get_by_id(topic_id)
        if not topic:
            raise NotFoundException("Tema no encontrado")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(topic, field, value)
        updated = await self.repo.update(topic)
        return TopicResponse.model_validate(updated)

    async def delete(self, topic_id: uuid.UUID) -> None:
        topic = await self.repo.get_by_id(topic_id)
        if not topic:
            raise NotFoundException("Tema no encontrado")
        await self.repo.soft_delete(topic)