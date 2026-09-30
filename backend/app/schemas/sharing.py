# backend/app/schemas/sharing.py
import uuid
from datetime import datetime
from typing import List, Any
from pydantic import BaseModel, ConfigDict
from app.core.constants import ShareScope


class DoctorShareCreate(BaseModel):
    parent_id: uuid.UUID
    share_scope: ShareScope = ShareScope.SUMMARY_ONLY
    expires_in_hours: int = 72


class DoctorShareResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    token: str
    share_scope: str
    expires_at: datetime
    access_count: int
    is_revoked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoctorBriefResponse(BaseModel):
    parent_name: str
    age: int
    blood_group: str
    allergies: List[str]
    chronic_conditions: List[str]
    active_medicines: List[dict[str, Any]]
    recent_reports: List[dict[str, Any]]
    recent_vitals: List[dict[str, Any]]
    emergency_contacts: List[dict[str, Any]]
    generated_at: datetime
