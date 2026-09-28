import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.exceptions import AuthorizationError
from app.core.permissions import verify_parent_access
from app.helpers.response_builder import build_response
from app.models.expense import HealthcareExpense, InsurancePolicy
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.expense import (
    HealthcareExpenseCreate,
    HealthcareExpenseResponse,
    InsurancePolicyCreate,
    InsurancePolicyResponse,
)

router = APIRouter(prefix="/expenses", tags=["Healthcare Expenses & Insurance"])


@router.get("/parent/{parent_id}", response_model=ApiResponse[list[HealthcareExpenseResponse]])
async def list_expenses(
    parent_id: uuid.UUID,
    category: Annotated[str | None, Query()] = None,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    query = (
        select(HealthcareExpense)
        .where(HealthcareExpense.parent_id == parent_id)
        .order_by(HealthcareExpense.expense_date.desc(), HealthcareExpense.created_at.desc())
    )
    if category:
        query = query.where(HealthcareExpense.category == category)
    rows = (await session.execute(query)).scalars().all()
    return build_response([HealthcareExpenseResponse.model_validate(row) for row in rows])


@router.post(
    "", response_model=ApiResponse[HealthcareExpenseResponse], status_code=status.HTTP_201_CREATED
)
async def create_expense(
    data: HealthcareExpenseCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, _ = await verify_parent_access(session, current_user.id, data.parent_id)
    if parent.family_id != data.family_id:
        raise AuthorizationError("The expense family does not match the parent profile.")
    item = HealthcareExpense(**data.model_dump())
    session.add(item)
    await session.flush()
    return build_response(HealthcareExpenseResponse.model_validate(item))


@router.get("/insurance/{parent_id}", response_model=ApiResponse[list[InsurancePolicyResponse]])
async def list_insurance(
    parent_id: uuid.UUID,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    rows = (
        (
            await session.execute(
                select(InsurancePolicy)
                .where(InsurancePolicy.parent_id == parent_id)
                .order_by(InsurancePolicy.expiry_date)
            )
        )
        .scalars()
        .all()
    )
    return build_response([InsurancePolicyResponse.model_validate(row) for row in rows])


@router.post(
    "/insurance",
    response_model=ApiResponse[InsurancePolicyResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_insurance(
    data: InsurancePolicyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, _ = await verify_parent_access(session, current_user.id, data.parent_id)
    if parent.family_id != data.family_id:
        raise AuthorizationError("The insurance family does not match the parent profile.")
    item = InsurancePolicy(**data.model_dump())
    session.add(item)
    await session.flush()
    return build_response(InsurancePolicyResponse.model_validate(item))
