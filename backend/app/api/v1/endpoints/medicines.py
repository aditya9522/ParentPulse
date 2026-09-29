# backend/app/api/v1/endpoints/medicines.py
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.concurrency import enforce_record_version
from app.core.exceptions import AuthorizationError
from app.core.permissions import verify_parent_access
from app.helpers.response_builder import build_response
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.medicine import (
    DoseLogResponse,
    DoseRecordRequest,
    MedicineCreate,
    MedicineResponse,
    MedicineUpdate,
)
from app.services.medicine_service import MedicineService

router = APIRouter(prefix="/medicines", tags=["Medicines"])


@router.post("", response_model=ApiResponse[MedicineResponse])
async def create_medicine(
    data: MedicineCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, member = await verify_parent_access(session, current_user.id, data.parent_id)
    if data.family_id != parent.family_id:
        raise AuthorizationError("The medicine family does not match the selected parent.")
    if not member.can_manage_medicines:
        raise AuthorizationError("Medicine management permission is required.")
    service = MedicineService(session)
    med = await service.create_medicine(data)
    return build_response(MedicineResponse.model_validate(med))


@router.get("/parent/{parent_id}", response_model=ApiResponse[list[MedicineResponse]])
async def list_parent_medicines(
    parent_id: UUID,
    active_only: bool = Query(True),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = MedicineService(session)
    meds = await service.list_medicines(parent_id, active_only)
    return build_response([MedicineResponse.model_validate(m) for m in meds])


@router.patch("/{medicine_id}", response_model=ApiResponse[MedicineResponse])
async def update_medicine(
    medicine_id: UUID,
    data: MedicineUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    service = MedicineService(session)
    existing = await service.med_repo.get_by_id(medicine_id)
    if not existing:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError("Medicine", medicine_id)
    _, member = await verify_parent_access(session, current_user.id, existing.parent_id)
    if not member.can_manage_medicines:
        raise AuthorizationError("Medicine management permission is required.")
    enforce_record_version(existing.updated_at, record_version, conflict_resolution)
    med = await service.update_medicine(medicine_id, data)
    return build_response(MedicineResponse.model_validate(med))


@router.post("/{medicine_id}/doses", response_model=ApiResponse[DoseLogResponse])
async def record_dose(
    medicine_id: UUID,
    dose_data: DoseRecordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = MedicineService(session)
    existing = await service.med_repo.get_by_id(medicine_id)
    if not existing:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError("Medicine", medicine_id)
    _, member = await verify_parent_access(session, current_user.id, existing.parent_id)
    if not member.can_manage_medicines:
        raise AuthorizationError("Medicine management permission is required.")
    dose = await service.record_dose(medicine_id, current_user.id, dose_data)
    return build_response(DoseLogResponse.model_validate(dose))


@router.get("/parent/{parent_id}/dose-history", response_model=ApiResponse[list[DoseLogResponse]])
async def get_parent_dose_history(
    parent_id: UUID,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = MedicineService(session)
    logs = await service.get_parent_dose_logs(parent_id)
    return build_response([DoseLogResponse.model_validate(l) for l in logs])
