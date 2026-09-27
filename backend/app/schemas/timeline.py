# backend/app/schemas/timeline.py
import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
from app.core.constants import TimelineEventType


class TimelineEventCreate(BaseModel):
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    description: str
    event_type: TimelineEventType
    event_date: datetime
    doctor_name: Optional[str] = None
    facility_name: Optional[str] = None
    document_id: Optional[uuid.UUID] = None
    metadata: dict[str, Any] = {}


class TimelineEventResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    description: str
    event_type: str
    event_date: datetime
    doctor_name: Optional[str] = None
    facility_name: Optional[str] = None
    document_id: Optional[uuid.UUID] = None
    metadata_json: dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
