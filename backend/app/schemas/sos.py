import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PushDeviceRegister(BaseModel):
    expo_push_token: str = Field(..., min_length=20, max_length=255)
    platform: Literal["android", "ios"]
    device_name: str | None = Field(None, max_length=120)


class SosCreate(BaseModel):
    parent_id: uuid.UUID
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    message: str | None = Field(None, max_length=500)


class SosAcknowledge(BaseModel):
    response: Literal["acknowledged", "responding"] = "acknowledged"


class SosResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    status: str
    recipients_registered: int
    pushes_accepted: int
    acknowledgements: int = 0
    created_at: datetime
    resolved_at: datetime | None = None
