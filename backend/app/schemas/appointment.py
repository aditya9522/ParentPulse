# backend/app/schemas/appointment.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import AppointmentStatus


class AppointmentCreate(BaseModel):
    id: uuid.UUID | None = None
    parent_id: uuid.UUID
    family_id: uuid.UUID
    doctor_name: str
    specialty: str
    hospital_clinic_name: str
    appointment_date: datetime
    reason: str | None = None
    notes: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    google_place_id: str | None = None
    assigned_to_user_id: uuid.UUID | None = None
    related_document_ids: list[str] = Field(default_factory=list, max_length=50)


class AppointmentUpdate(BaseModel):
    doctor_name: str | None = None
    specialty: str | None = None
    hospital_clinic_name: str | None = None
    appointment_date: datetime | None = None
    status: AppointmentStatus | None = None
    reason: str | None = None
    notes: str | None = None
    address: str | None = None
    assigned_to_user_id: uuid.UUID | None = None
    related_document_ids: list[str] | None = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    doctor_name: str
    specialty: str
    hospital_clinic_name: str
    appointment_date: datetime
    status: str
    reason: str | None = None
    notes: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    google_place_id: str | None = None
    assigned_to_user_id: uuid.UUID | None = None
    related_document_ids: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
