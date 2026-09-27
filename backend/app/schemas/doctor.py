# backend/app/schemas/doctor.py
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DoctorCreate(BaseModel):
    name: str
    specialty: str
    hospital_or_clinic: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None


class DoctorResponse(BaseModel):
    id: uuid.UUID
    name: str
    specialty: str
    hospital_or_clinic: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
