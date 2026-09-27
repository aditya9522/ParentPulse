# backend/app/api/v1/endpoints/caregivers.py
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.models.caregiver import Caregiver
from app.models.user import User
from app.schemas.caregiver import CaregiverCreate, CaregiverResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response

router = APIRouter(prefix="/caregivers", tags=["Caregivers"])


@router.post("", response_model=ApiResponse[CaregiverResponse])
async def assign_caregiver(
    data: CaregiverCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    caregiver = Caregiver(
        parent_id=data.parent_id,
        user_id=data.user_id,
        permissions=data.permissions,
        notes=data.notes,
    )
    session.add(caregiver)
    await session.flush()
    return build_response(CaregiverResponse.model_validate(caregiver))


@router.get("/parent/{parent_id}", response_model=ApiResponse[List[CaregiverResponse]])
async def list_parent_caregivers(
    parent_id: UUID,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Caregiver).where(Caregiver.parent_id == parent_id)
    res = await session.execute(stmt)
    caregivers = list(res.scalars().all())
    return build_response([CaregiverResponse.model_validate(c) for c in caregivers])
