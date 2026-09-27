# backend/app/schemas/expense.py
import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ExpenseCategory:
    DOCTOR = "doctor"
    MEDICINE = "medicine"
    LAB = "lab"
    HOSPITAL = "hospital"
    INSURANCE = "insurance"
    HOME_CARE = "home_care"
    OTHER = "other"


class HealthcareExpenseCreate(BaseModel):
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    category: str
    amount: float
    currency: str = "INR"
    expense_date: date
    provider_name: Optional[str] = None
    receipt_document_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
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
    provider_name: Optional[str] = None
    receipt_document_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    is_reimbursed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InsurancePolicyCreate(BaseModel):
    parent_id: uuid.UUID
    family_id: uuid.UUID
    provider: str
    policy_number: str
    plan_name: str
    coverage_amount: float
    currency: str = "INR"
    expiry_date: date
    tpa_cashless_helpline: Optional[str] = None
    notes: Optional[str] = None


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
    tpa_cashless_helpline: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
