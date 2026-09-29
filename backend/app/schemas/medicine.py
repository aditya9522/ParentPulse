# backend/app/schemas/medicine.py
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.core.constants import DoseStatus


class MedicineCreate(BaseModel):
    id: uuid.UUID | None = None
    parent_id: uuid.UUID
    family_id: uuid.UUID
    name: str
    dosage: str
    form: str = "tablet"
    frequency_times_per_day: int = 1
    schedule_times: list[str]  # e.g. ["08:00", "20:00"]
    instructions: str = "after_food"
    prescribing_doctor: str | None = None
    reason: str | None = None
    start_date: date
    end_date: date | None = None
    current_inventory: int = 0
    refill_alert_threshold: int = 5


class MedicineUpdate(BaseModel):
    name: str | None = None
    dosage: str | None = None
    form: str | None = None
    frequency_times_per_day: int | None = None
    schedule_times: list[str] | None = None
    instructions: str | None = None
    prescribing_doctor: str | None = None
    reason: str | None = None
    end_date: date | None = None
    current_inventory: int | None = None
    refill_alert_threshold: int | None = None
    is_active: bool | None = None


class MedicineResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    name: str
    dosage: str
    form: str
    frequency_times_per_day: int
    schedule_times: list[str]
    instructions: str
    prescribing_doctor: str | None = None
    reason: str | None = None
    start_date: date
    end_date: date | None = None
    current_inventory: int
    refill_alert_threshold: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoseRecordRequest(BaseModel):
    status: DoseStatus
    notes: str | None = None


class DoseLogResponse(BaseModel):
    id: uuid.UUID
    medicine_id: uuid.UUID
    parent_id: uuid.UUID
    scheduled_time: datetime
    status: str
    recorded_by: uuid.UUID | None = None
    recorded_at: datetime | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)
