import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.models.alternative import Alternative


class AlternativeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_bulk(self, alternatives: List[Alternative]) -> None:
        for alt in alternatives:
            self.db.add(alt)
        await self.db.commit()

    async def delete_by_question(self, question_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(Alternative).where(Alternative.question_id == question_id)
        )
        await self.db.commit()