import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.topic import Topic


class TopicRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Topic]:
        result = await self.db.execute(
            select(Topic).where(Topic.deleted_at == None, Topic.is_active == True)
        )
        return list(result.scalars().all())

    async def get_by_id(self, topic_id: uuid.UUID) -> Optional[Topic]:
        result = await self.db.execute(
            select(Topic).where(Topic.id == topic_id, Topic.deleted_at == None)
        )
        return result.scalar_one_or_none()

    async def create(self, topic: Topic) -> Topic:
        self.db.add(topic)
        await self.db.commit()
        await self.db.refresh(topic)
        return topic

    async def update(self, topic: Topic) -> Topic:
        await self.db.commit()
        await self.db.refresh(topic)
        return topic

    async def soft_delete(self, topic: Topic) -> None:
        topic.deleted_at = datetime.utcnow()
        await self.db.commit()
