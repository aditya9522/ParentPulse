# backend/app/crud/timeline.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.timeline_event import TimelineEvent


class TimelineRepository(BaseRepository[TimelineEvent]):
    def __init__(self, session: AsyncSession):
        super().__init__(TimelineEvent, session)

    async def list_by_parent(
        self,
        parent_id: UUID,
        event_type: Optional[str] = None,
    ) -> List[TimelineEvent]:
        conditions = [TimelineEvent.parent_id == parent_id]
        if event_type:
            conditions.append(TimelineEvent.event_type == event_type)

        stmt = select(TimelineEvent).where(and_(*conditions)).order_by(TimelineEvent.event_date.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
