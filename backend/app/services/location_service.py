# backend/app/services/location_service.py
from uuid import UUID
from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.locations import LocationRepository
from app.models.location_visit import LocationVisit
from app.schemas.location import LocationVisitCreate, LocationVisitUpdate
from app.core.exceptions import ResourceNotFoundError


class LocationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.loc_repo = LocationRepository(session)

    async def list_parent_visits(self, parent_id: UUID) -> List[LocationVisit]:
        return await self.loc_repo.list_visits_by_parent(parent_id)

    async def record_visit(
        self,
        family_id: UUID,
        user_id: UUID,
        data: LocationVisitCreate,
    ) -> LocationVisit:
        visited_at = data.visited_at or datetime.now(timezone.utc)
        return await self.loc_repo.create(
            parent_id=data.parent_id,
            family_id=family_id,
            place_id=data.place_id,
            place_name=data.place_name,
            category=data.category.value,
            address=data.address,
            latitude=data.latitude,
            longitude=data.longitude,
            visited_at=visited_at,
            appointment_id=data.appointment_id,
            notes=data.notes,
            confirmed_by=user_id,
        )

    async def update_visit(self, visit_id: UUID, data: LocationVisitUpdate) -> LocationVisit:
        visit = await self.loc_repo.update(visit_id, **data.model_dump(exclude_unset=True))
        if not visit:
            raise ResourceNotFoundError("LocationVisit", visit_id)
        return visit

    async def delete_visit(self, visit_id: UUID) -> None:
        await self.loc_repo.delete(visit_id)
