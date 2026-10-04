# backend/app/schemas/timeline.py
import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field
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
    metadata: dict[str, Any] = Field(default_factory=dict)


class TimelineEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[TimelineEventType] = None
    event_date: Optional[datetime] = None
    doctor_name: Optional[str] = None
    facility_name: Optional[str] = None
    document_id: Optional[uuid.UUID] = None
    metadata: Optional[dict[str, Any]] = None


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
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
