# backend/app/crud/appointments.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.appointment import Appointment


class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self, session: AsyncSession):
        super().__init__(Appointment, session)

    async def list_by_parent(
        self,
        parent_id: UUID,
        status: Optional[str] = None,
    ) -> List[Appointment]:
        conditions = [Appointment.parent_id == parent_id]
        if status:
            conditions.append(Appointment.status == status)

        stmt = select(Appointment).where(and_(*conditions)).order_by(Appointment.appointment_date.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
