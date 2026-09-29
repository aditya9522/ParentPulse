# backend/app/schemas/family.py
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.schemas.user import UserResponse


class FamilyCreate(BaseModel):
    name: str


class FamilyUpdate(BaseModel):
    name: str


class FamilyMemberInvite(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone_number: str | None = Field(default=None, min_length=7, max_length=30)
    role: Literal["family_member", "caregiver", "doctor"] = "family_member"
    relationship: str = Field(min_length=1, max_length=100)
    can_manage_medicines: bool = True
    can_manage_appointments: bool = True
    can_upload_documents: bool = True
    can_share_doctor_brief: bool = False
    can_view_location_history: bool = True


class FamilyMemberUpdate(BaseModel):
    role: Literal["family_member", "caregiver", "doctor"] | None = None
    relationship: str | None = Field(default=None, min_length=1, max_length=100)
    can_manage_medicines: bool | None = None
    can_manage_appointments: bool | None = None
    can_upload_documents: bool | None = None
    can_share_doctor_brief: bool | None = None
    can_view_location_history: bool | None = None

    @model_validator(mode="after")
    def require_change(self):
        if not self.model_fields_set:
            raise ValueError("At least one member field must be provided.")
        return self


class FamilyMemberResponse(BaseModel):
    id: uuid.UUID
    family_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    relationship_name: str
    can_manage_medicines: bool
    can_manage_appointments: bool
    can_upload_documents: bool
    can_share_doctor_brief: bool
    can_view_location_history: bool
    created_at: datetime
    user: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class FamilyResponse(BaseModel):
    id: uuid.UUID
    name: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    members: list[FamilyMemberResponse] | None = None

    model_config = ConfigDict(from_attributes=True)
