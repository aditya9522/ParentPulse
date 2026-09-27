# backend/app/services/timeline_service.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.timeline import TimelineRepository
from app.models.timeline_event import TimelineEvent
from app.schemas.timeline import TimelineEventCreate


class TimelineService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.timeline_repo = TimelineRepository(session)

    async def list_events(
        self,
        parent_id: UUID,
        event_type: Optional[str] = None,
    ) -> List[TimelineEvent]:
        return await self.timeline_repo.list_by_parent(parent_id, event_type)

    async def create_event(self, data: TimelineEventCreate) -> TimelineEvent:
        return await self.timeline_repo.create(
            parent_id=data.parent_id,
            family_id=data.family_id,
            title=data.title,
            description=data.description,
            event_type=data.event_type.value,
            event_date=data.event_date,
            doctor_name=data.doctor_name,
            facility_name=data.facility_name,
            document_id=data.document_id,
            metadata_json=data.metadata,
        )
