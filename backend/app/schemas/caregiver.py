# backend/app/schemas/caregiver.py
import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class CaregiverCreate(BaseModel):
    parent_id: uuid.UUID
    user_id: uuid.UUID
    permissions: dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class CaregiverResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    user_id: uuid.UUID
    permissions: dict[str, Any]
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
