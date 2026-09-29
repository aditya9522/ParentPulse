# backend/app/services/medicine_service.py
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundError
from app.crud.medicines import MedicineRepository
from app.models.medicine import Medicine, MedicineDoseLog
from app.schemas.medicine import DoseRecordRequest, MedicineCreate, MedicineUpdate


class MedicineService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.med_repo = MedicineRepository(session)

    async def list_medicines(self, parent_id: UUID, active_only: bool = True) -> list[Medicine]:
        return await self.med_repo.list_by_parent(parent_id, active_only=active_only)

    async def create_medicine(self, data: MedicineCreate) -> Medicine:
        return await self.med_repo.create(
            id=data.id,
            parent_id=data.parent_id,
            family_id=data.family_id,
            name=data.name,
            dosage=data.dosage,
            form=data.form,
            frequency_times_per_day=data.frequency_times_per_day,
            schedule_times=data.schedule_times,
            instructions=data.instructions,
            prescribing_doctor=data.prescribing_doctor,
            reason=data.reason,
            start_date=data.start_date,
            end_date=data.end_date,
            current_inventory=data.current_inventory,
            refill_alert_threshold=data.refill_alert_threshold,
        )

    async def update_medicine(self, medicine_id: UUID, data: MedicineUpdate) -> Medicine:
        med = await self.med_repo.update(medicine_id, **data.model_dump(exclude_unset=True))
        if not med:
            raise ResourceNotFoundError("Medicine", medicine_id)
        return med

    async def record_dose(
        self,
        medicine_id: UUID,
        user_id: UUID,
        dose_data: DoseRecordRequest,
    ) -> MedicineDoseLog:
        med = await self.med_repo.get_by_id(medicine_id)
        if not med:
            raise ResourceNotFoundError("Medicine", medicine_id)

        now = datetime.now(UTC)
        dose = await self.med_repo.record_dose(
            medicine_id=medicine_id,
            parent_id=med.parent_id,
            scheduled_time=now,
            status=dose_data.status.value,
            recorded_by=user_id,
            recorded_at=now,
            notes=dose_data.notes,
        )

        # Decrement inventory if dose taken
        if dose_data.status.value == "taken" and med.current_inventory > 0:
            await self.med_repo.update(med.id, current_inventory=med.current_inventory - 1)

        return dose

    async def get_parent_dose_logs(self, parent_id: UUID) -> list[MedicineDoseLog]:
        return await self.med_repo.get_dose_logs_for_parent(parent_id)
