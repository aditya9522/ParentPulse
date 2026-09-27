# backend/app/schemas/medicine.py
import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.core.constants import DoseStatus


class MedicineCreate(BaseModel):
    parent_id: uuid.UUID
    family_id: uuid.UUID
    name: str
    dosage: str
    form: str = "tablet"
    frequency_times_per_day: int = 1
    schedule_times: List[str]  # e.g. ["08:00", "20:00"]
    instructions: str = "after_food"
    prescribing_doctor: Optional[str] = None
    reason: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    current_inventory: int = 0
    refill_alert_threshold: int = 5


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    form: Optional[str] = None
    frequency_times_per_day: Optional[int] = None
    schedule_times: Optional[List[str]] = None
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    reason: Optional[str] = None
    end_date: Optional[date] = None
    current_inventory: Optional[int] = None
    refill_alert_threshold: Optional[int] = None
    is_active: Optional[bool] = None


class MedicineResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    name: str
    dosage: str
    form: str
    frequency_times_per_day: int
    schedule_times: List[str]
    instructions: str
    prescribing_doctor: Optional[str] = None
    reason: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    current_inventory: int
    refill_alert_threshold: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoseRecordRequest(BaseModel):
    status: DoseStatus
    notes: Optional[str] = None


class DoseLogResponse(BaseModel):
    id: uuid.UUID
    medicine_id: uuid.UUID
    parent_id: uuid.UUID
    scheduled_time: datetime
    status: str
    recorded_by: Optional[uuid.UUID] = None
    recorded_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
