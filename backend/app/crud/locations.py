# backend/app/crud/locations.py
from uuid import UUID
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.location_visit import LocationVisit
from app.models.saved_place import SavedPlace


class LocationRepository(BaseRepository[LocationVisit]):
    def __init__(self, session: AsyncSession):
        super().__init__(LocationVisit, session)

    async def list_visits_by_parent(self, parent_id: UUID) -> List[LocationVisit]:
        stmt = (
            select(LocationVisit)
            .where(LocationVisit.parent_id == parent_id)
            .order_by(LocationVisit.visited_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save_place(self, **kwargs) -> SavedPlace:
        place = SavedPlace(**kwargs)
        self.session.add(place)
        await self.session.flush()
        return place
