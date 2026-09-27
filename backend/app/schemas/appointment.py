# backend/app/schemas/appointment.py
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.core.constants import AppointmentStatus


class AppointmentCreate(BaseModel):
    parent_id: uuid.UUID
    family_id: uuid.UUID
    doctor_name: str
    specialty: str
    hospital_clinic_name: str
    appointment_date: datetime
    reason: Optional[str] = None
    notes: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_place_id: Optional[str] = None
    assigned_to_user_id: Optional[uuid.UUID] = None
    related_document_ids: List[str] = []


class AppointmentUpdate(BaseModel):
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    hospital_clinic_name: Optional[str] = None
    appointment_date: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    address: Optional[str] = None
    assigned_to_user_id: Optional[uuid.UUID] = None
    related_document_ids: Optional[List[str]] = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    doctor_name: str
    specialty: str
    hospital_clinic_name: str
    appointment_date: datetime
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_place_id: Optional[str] = None
    assigned_to_user_id: Optional[uuid.UUID] = None
    related_document_ids: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
