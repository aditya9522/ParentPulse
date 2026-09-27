# backend/app/api/v1/endpoints/expenses.py
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.models.user import User
from app.schemas.expense import (
    HealthcareExpenseCreate,
    HealthcareExpenseResponse,
    InsurancePolicyCreate,
    InsurancePolicyResponse,
)
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response

router = APIRouter(prefix="/expenses", tags=["Healthcare Expenses & Insurance"])

# Persistent in-memory store for expenses & insurance
_DEMO_EXPENSES: List[dict] = [
    {
        "id": uuid.UUID("eeeeeeee-0001-4000-8000-000000000001"),
        "parent_id": uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        "family_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "title": "Dr. Arun Verma Consultation Fee",
        "category": "doctor",
        "amount": 1500.0,
        "currency": "INR",
        "expense_date": date(2026, 9, 15),
        "provider_name": "Fortis Memorial Research Institute",
        "receipt_document_id": None,
        "notes": "Quarterly cardiology review consultation",
        "is_reimbursed": True,
        "created_at": datetime(2026, 9, 15, 11, 30),
    },
    {
        "id": uuid.UUID("eeeeeeee-0002-4000-8000-000000000002"),
        "parent_id": uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        "family_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "title": "Monthly Blood Pressure & Diabetes Medicines",
        "category": "medicine",
        "amount": 3450.0,
        "currency": "INR",
        "expense_date": date(2026, 9, 15),
        "provider_name": "Apollo Pharmacy Sector 14",
        "receipt_document_id": None,
        "notes": "Telmisartan 40mg (60 tabs) & Metformin SR 500mg (60 tabs)",
        "is_reimbursed": False,
        "created_at": datetime(2026, 9, 15, 12, 45),
    },
    {
        "id": uuid.UUID("eeeeeeee-0003-4000-8000-000000000003"),
        "parent_id": uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        "family_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "title": "Comprehensive Lipid Panel & HbA1c Test",
        "category": "lab",
        "amount": 2200.0,
        "currency": "INR",
        "expense_date": date(2026, 9, 12),
        "provider_name": "Dr. Lal PathLabs",
        "receipt_document_id": None,
        "notes": "Home blood sample collection",
        "is_reimbursed": True,
        "created_at": datetime(2026, 9, 12, 9, 0),
    },
]

_DEMO_INSURANCE: List[dict] = [
    {
        "id": uuid.UUID("ffffffff-0001-4000-8000-000000000001"),
        "parent_id": uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        "family_id": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        "provider": "Star Health Senior Citizens Red Carpet",
        "policy_number": "SH-SENIOR-98214-GUR",
        "plan_name": "Comprehensive Senior Health Guard",
        "coverage_amount": 1500000.0,
        "currency": "INR",
        "expiry_date": date(2027, 3, 31),
        "tpa_cashless_helpline": "1800-425-2255",
        "notes": "Cashless pre-authorization accepted at Fortis & Max Hospitals",
        "created_at": datetime(2026, 1, 1, 10, 0),
    }
]


@router.get("/parent/{parent_id}", response_model=ApiResponse[List[HealthcareExpenseResponse]])
async def list_expenses(
    parent_id: uuid.UUID,
    category: Optional[str] = Query(None),
    context=Depends(get_parent_access_context),
):
    results = [e for e in _DEMO_EXPENSES if e["parent_id"] == parent_id]
    if category:
        results = [e for e in results if e["category"] == category]
    return build_response([HealthcareExpenseResponse(**e) for e in results])


@router.post("", response_model=ApiResponse[HealthcareExpenseResponse])
async def create_expense(
    data: HealthcareExpenseCreate,
    current_user: User = Depends(get_current_user),
):
    item = {
        "id": uuid.uuid4(),
        "parent_id": data.parent_id,
        "family_id": data.family_id,
        "title": data.title,
        "category": data.category,
        "amount": data.amount,
        "currency": data.currency,
        "expense_date": data.expense_date,
        "provider_name": data.provider_name,
        "receipt_document_id": data.receipt_document_id,
        "notes": data.notes,
        "is_reimbursed": data.is_reimbursed,
        "created_at": datetime.now(),
    }
    _DEMO_EXPENSES.insert(0, item)
    return build_response(HealthcareExpenseResponse(**item))


@router.get("/insurance/{parent_id}", response_model=ApiResponse[List[InsurancePolicyResponse]])
async def list_insurance(
    parent_id: uuid.UUID,
    context=Depends(get_parent_access_context),
):
    results = [i for i in _DEMO_INSURANCE if i["parent_id"] == parent_id]
    return build_response([InsurancePolicyResponse(**i) for i in results])


@router.post("/insurance", response_model=ApiResponse[InsurancePolicyResponse])
async def create_insurance(
    data: InsurancePolicyCreate,
    current_user: User = Depends(get_current_user),
):
    item = {
        "id": uuid.uuid4(),
        "parent_id": data.parent_id,
        "family_id": data.family_id,
        "provider": data.provider,
        "policy_number": data.policy_number,
        "plan_name": data.plan_name,
        "coverage_amount": data.coverage_amount,
        "currency": data.currency,
        "expiry_date": data.expiry_date,
        "tpa_cashless_helpline": data.tpa_cashless_helpline,
        "notes": data.notes,
        "created_at": datetime.now(),
    }
    _DEMO_INSURANCE.insert(0, item)
    return build_response(InsurancePolicyResponse(**item))
