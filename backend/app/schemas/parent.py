# backend/app/schemas/parent.py
import uuid
from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone_number: str
    is_primary: bool = False


class PrimaryDoctorSchema(BaseModel):
    name: str
    specialty: str
    hospital_or_clinic: str
    phone_number: str
    address: Optional[str] = None


class SurgeryRecordSchema(BaseModel):
    name: str
    date: Optional[str] = None
    notes: Optional[str] = None


class ParentProfileCreate(BaseModel):
    family_id: uuid.UUID
    full_name: str
    date_of_birth: date
    gender: str
    blood_group: str
    preferred_language: str = "en"
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_number: str
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    disabilities: List[str] = Field(default_factory=list)
    surgeries: List[SurgeryRecordSchema] = Field(default_factory=list)
    emergency_contacts: List[EmergencyContactSchema] = Field(default_factory=list)
    primary_doctors: List[PrimaryDoctorSchema] = Field(default_factory=list)
    notes: Optional[str] = None

    @field_validator("gender", mode="before")
    @classmethod
    def clean_gender(cls, v: Any) -> str:
        if isinstance(v, str):
            cleaned = v.strip().lower()
            if cleaned in {"male", "female", "other"}:
                return cleaned
        return "other"


class ParentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    preferred_language: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_number: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    disabilities: Optional[List[str]] = None
    surgeries: Optional[List[SurgeryRecordSchema]] = None
    emergency_contacts: Optional[List[EmergencyContactSchema]] = None
    primary_doctors: Optional[List[PrimaryDoctorSchema]] = None
    notes: Optional[str] = None

    @field_validator("gender", mode="before")
    @classmethod
    def clean_gender(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            cleaned = v.strip().lower()
            if cleaned in {"male", "female", "other"}:
                return cleaned
        return "other"


class ParentProfileResponse(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    full_name: str
    date_of_birth: date
    gender: str
    blood_group: str
    preferred_language: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_number: str
    allergies: List[Any] = Field(default_factory=list)
    chronic_conditions: List[Any] = Field(default_factory=list)
    disabilities: List[Any] = Field(default_factory=list)
    surgeries: List[Any] = Field(default_factory=list)
    emergency_contacts: List[Any] = Field(default_factory=list)
    primary_doctors: List[Any] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
