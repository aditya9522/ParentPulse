# backend/app/crud/parents.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.parent_profile import ParentProfile


class ParentRepository(BaseRepository[ParentProfile]):
    def __init__(self, session: AsyncSession):
        super().__init__(ParentProfile, session)

    async def get_by_family(self, family_id: UUID) -> List[ParentProfile]:
        stmt = select(ParentProfile).where(ParentProfile.family_id == family_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_and_family(self, parent_id: UUID, family_id: UUID) -> Optional[ParentProfile]:
        stmt = select(ParentProfile).where(
            ParentProfile.id == parent_id,
            ParentProfile.family_id == family_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
