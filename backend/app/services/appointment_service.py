# backend/app/services/appointment_service.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.appointments import AppointmentRepository
from app.crud.timeline import TimelineRepository
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.core.exceptions import ResourceNotFoundError


class AppointmentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.app_repo = AppointmentRepository(session)
        self.timeline_repo = TimelineRepository(session)

    async def list_appointments(
        self,
        parent_id: UUID,
        status: Optional[str] = None,
    ) -> List[Appointment]:
        return await self.app_repo.list_by_parent(parent_id, status)

    async def create_appointment(self, data: AppointmentCreate) -> Appointment:
        app = await self.app_repo.create(
            parent_id=data.parent_id,
            family_id=data.family_id,
            doctor_name=data.doctor_name,
            specialty=data.specialty,
            hospital_clinic_name=data.hospital_clinic_name,
            appointment_date=data.appointment_date,
            reason=data.reason,
            notes=data.notes,
            address=data.address,
            latitude=data.latitude,
            longitude=data.longitude,
            google_place_id=data.google_place_id,
            assigned_to_user_id=data.assigned_to_user_id,
            related_document_ids=data.related_document_ids,
        )

        # Create timeline event for future consultation
        await self.timeline_repo.create(
            parent_id=app.parent_id,
            family_id=app.family_id,
            title=f"Appointment with {app.doctor_name}",
            description=f"{app.specialty} at {app.hospital_clinic_name}. Reason: {app.reason or 'Consultation'}",
            event_type="doctor_visit",
            event_date=app.appointment_date,
            doctor_name=app.doctor_name,
            facility_name=app.hospital_clinic_name,
        )
        return app

    async def update_appointment(self, appointment_id: UUID, data: AppointmentUpdate) -> Appointment:
        update_dict = data.model_dump(exclude_unset=True)
        if "status" in update_dict and update_dict["status"]:
            update_dict["status"] = update_dict["status"].value
        app = await self.app_repo.update(appointment_id, **update_dict)
        if not app:
            raise ResourceNotFoundError("Appointment", appointment_id)
        return app
