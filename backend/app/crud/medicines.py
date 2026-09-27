# backend/app/crud/medicines.py
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.medicine import Medicine, MedicineDoseLog


class MedicineRepository(BaseRepository[Medicine]):
    def __init__(self, session: AsyncSession):
        super().__init__(Medicine, session)

    async def list_by_parent(self, parent_id: UUID, active_only: bool = True) -> List[Medicine]:
        conditions = [Medicine.parent_id == parent_id]
        if active_only:
            conditions.append(Medicine.is_active.is_(True))

        stmt = select(Medicine).where(and_(*conditions)).order_by(Medicine.name.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def record_dose(
        self,
        medicine_id: UUID,
        parent_id: UUID,
        scheduled_time: datetime,
        status: str,
        recorded_by: UUID,
        recorded_at: datetime,
        notes: Optional[str] = None,
    ) -> MedicineDoseLog:
        dose = MedicineDoseLog(
            medicine_id=medicine_id,
            parent_id=parent_id,
            scheduled_time=scheduled_time,
            status=status,
            recorded_by=recorded_by,
            recorded_at=recorded_at,
            notes=notes,
        )
        self.session.add(dose)
        await self.session.flush()
        return dose

    async def get_dose_logs_for_parent(self, parent_id: UUID) -> List[MedicineDoseLog]:
        stmt = (
            select(MedicineDoseLog)
            .where(MedicineDoseLog.parent_id == parent_id)
            .order_by(MedicineDoseLog.scheduled_time.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
