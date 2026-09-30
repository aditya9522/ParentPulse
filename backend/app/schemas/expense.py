# backend/app/schemas/expense.py
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class ExpenseCategory:
    DOCTOR = "doctor"
    MEDICINE = "medicine"
    LAB = "lab"
    HOSPITAL = "hospital"
    INSURANCE = "insurance"
    HOME_CARE = "home_care"
    OTHER = "other"


class HealthcareExpenseCreate(BaseModel):
    id: uuid.UUID | None = None
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str = Field(min_length=1, max_length=200)
    category: Literal["doctor", "medicine", "lab", "hospital", "insurance", "home_care", "other"]
    amount: float = Field(gt=0, le=1_000_000_000)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    expense_date: date
    provider_name: str | None = None
    receipt_document_id: uuid.UUID | None = None
    notes: str | None = None
    is_reimbursed: bool = False


class HealthcareExpenseResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    category: str
    amount: float
    currency: str
    expense_date: date
    provider_name: str | None = None
    receipt_document_id: uuid.UUID | None = None
    notes: str | None = None
    is_reimbursed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InsurancePolicyCreate(BaseModel):
    id: uuid.UUID | None = None
    parent_id: uuid.UUID
    family_id: uuid.UUID
    provider: str = Field(min_length=1, max_length=200)
    policy_number: str = Field(min_length=1, max_length=100)
    plan_name: str = Field(min_length=1, max_length=200)
    coverage_amount: float = Field(gt=0, le=10_000_000_000)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    expiry_date: date
    tpa_cashless_helpline: str | None = None
    notes: str | None = None


class InsurancePolicyResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    provider: str
    policy_number: str
    plan_name: str
    coverage_amount: float
    currency: str
    expiry_date: date
    tpa_cashless_helpline: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
