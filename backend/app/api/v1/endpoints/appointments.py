# backend/app/api/v1/endpoints/appointments.py
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.appointment_service import AppointmentService
from app.core.exceptions import AuthorizationError, ResourceNotFoundError
from app.core.permissions import verify_parent_access

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=ApiResponse[AppointmentResponse])
async def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    _, member = await verify_parent_access(session, current_user.id, data.parent_id)
    if not member.can_manage_appointments:
        raise AuthorizationError("Appointment management permission is required.")
    service = AppointmentService(session)
    appointment = await service.create_appointment(data)
    return build_response(AppointmentResponse.model_validate(appointment))


@router.get("/parent/{parent_id}", response_model=ApiResponse[List[AppointmentResponse]])
async def list_parent_appointments(
    parent_id: UUID,
    status: Optional[str] = Query(None),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = AppointmentService(session)
    appointments = await service.list_appointments(parent_id, status)
    return build_response([AppointmentResponse.model_validate(a) for a in appointments])


@router.patch("/{appointment_id}", response_model=ApiResponse[AppointmentResponse])
async def update_appointment(
    appointment_id: UUID,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = AppointmentService(session)
    existing = await service.app_repo.get_by_id(appointment_id)
    if not existing:
        raise ResourceNotFoundError("Appointment", appointment_id)
    _, member = await verify_parent_access(session, current_user.id, existing.parent_id)
    if not member.can_manage_appointments:
        raise AuthorizationError("Appointment management permission is required.")
    updated = await service.update_appointment(appointment_id, data)
    return build_response(AppointmentResponse.model_validate(updated))
