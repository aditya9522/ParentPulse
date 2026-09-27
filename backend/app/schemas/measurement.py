# backend/app/schemas/measurement.py
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.core.constants import VitalType


class MeasurementCreate(BaseModel):
    parent_id: uuid.UUID
    vital_type: VitalType
    value_numeric: float
    value_secondary: Optional[float] = None
    unit: str
    recorded_at: Optional[datetime] = None
    notes: Optional[str] = None


class MeasurementResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    vital_type: str
    value_numeric: float
    value_secondary: Optional[float] = None
    unit: str
    recorded_at: datetime
    notes: Optional[str] = None
    recorded_by: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
