import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

ConsentType = Literal[
    "location_history",
    "sos_location_sharing",
    "ai_assistant",
    "voice_input",
]


class ConsentUpdate(BaseModel):
    granted: bool
    policy_version: str = Field(default="2026-09", min_length=1, max_length=30)


class ConsentResponse(BaseModel):
    id: uuid.UUID
    consent_type: ConsentType
    granted: bool
    policy_version: str
    source: str
    occurred_at: datetime


class DeletionImpact(BaseModel):
    owned_care_circles: int
    shared_care_circles: int
    parent_profiles_removed: int
    medical_documents_removed: int
    confirmation_phrase: str


class DeleteAccountRequest(BaseModel):
    credential_type: Literal["password", "google"]
    password: str | None = Field(default=None, min_length=1, max_length=256)
    google_id_token: str | None = Field(default=None, min_length=100, max_length=10000)
    confirmation: str

    @model_validator(mode="after")
    def require_matching_credential(self) -> "DeleteAccountRequest":
        if self.credential_type == "password" and not self.password:
            raise ValueError("Current password is required.")
        if self.credential_type == "google" and not self.google_id_token:
            raise ValueError("A fresh Google identity token is required.")
        return self


class DeleteAccountResponse(BaseModel):
    deleted: bool
    auth_cleanup_status: Literal["completed", "pending"]


class AuthMethodsResponse(BaseModel):
    methods: list[Literal["password", "google"]]


class AccountExport(BaseModel):
    format_version: str
    generated_at: datetime
    account: dict[str, Any]
    consents: list[dict[str, Any]]
    care_circles: list[dict[str, Any]]
    records: dict[str, list[dict[str, Any]]]
    notes: list[str]
