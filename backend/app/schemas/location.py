# backend/app/schemas/location.py
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.core.constants import PlaceCategory


class LocationVisitCreate(BaseModel):
    parent_id: uuid.UUID
    place_id: Optional[str] = None
    place_name: str
    category: PlaceCategory
    address: str
    latitude: float
    longitude: float
    visited_at: Optional[datetime] = None
    appointment_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class LocationVisitUpdate(BaseModel):
    notes: Optional[str] = None
    visited_at: Optional[datetime] = None


class LocationVisitResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    place_id: Optional[str] = None
    place_name: str
    category: str
    address: str
    latitude: float
    longitude: float
    visited_at: datetime
    appointment_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    confirmed_by: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
