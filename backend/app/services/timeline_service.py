# backend/app/services/timeline_service.py
from uuid import UUID
from typing import List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.timeline import TimelineRepository
from app.models.timeline_event import TimelineEvent
from app.schemas.timeline import TimelineEventCreate, TimelineEventUpdate


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

    async def update_event(self, event_id: UUID, data: TimelineEventUpdate) -> Optional[TimelineEvent]:
        update_data: dict[str, Any] = {}
        if data.title is not None:
            update_data["title"] = data.title
        if data.description is not None:
            update_data["description"] = data.description
        if data.event_type is not None:
            update_data["event_type"] = data.event_type.value
        if data.event_date is not None:
            update_data["event_date"] = data.event_date
        if data.doctor_name is not None:
            update_data["doctor_name"] = data.doctor_name
        if data.facility_name is not None:
            update_data["facility_name"] = data.facility_name
        if data.document_id is not None:
            update_data["document_id"] = data.document_id
        if data.metadata is not None:
            update_data["metadata_json"] = data.metadata

        if not update_data:
            return await self.timeline_repo.get_by_id(event_id)

        return await self.timeline_repo.update(event_id, **update_data)
