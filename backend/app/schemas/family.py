# backend/app/schemas/family.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class FamilyCreate(BaseModel):
    name: str


class FamilyUpdate(BaseModel):
    name: str


class FamilyMemberInvite(BaseModel):
    email: str
    full_name: str | None = None
    phone_number: str | None = None
    role: str = "family_member"
    relationship: str
    can_manage_medicines: bool = True
    can_manage_appointments: bool = True
    can_upload_documents: bool = True
    can_share_doctor_brief: bool = False
    can_view_location_history: bool = True


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
