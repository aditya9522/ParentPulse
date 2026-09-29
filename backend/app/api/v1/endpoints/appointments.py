# backend/app/api/v1/endpoints/appointments.py
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.concurrency import enforce_record_version
from app.core.exceptions import AuthorizationError, ParentPulseException, ResourceNotFoundError
from app.core.permissions import verify_family_membership, verify_parent_access
from app.helpers.response_builder import build_response
from app.models.document import Document
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from app.schemas.common import ApiResponse
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/appointments", tags=["Appointments"])


async def _verify_appointment_links(
    session: AsyncSession,
    parent_id: UUID,
    family_id: UUID,
    assigned_to_user_id: UUID | None,
    related_document_ids: list[str] | None,
) -> None:
    if assigned_to_user_id:
        await verify_family_membership(session, assigned_to_user_id, family_id)
    if not related_document_ids:
        return
    try:
        document_ids = [UUID(value) for value in related_document_ids]
    except ValueError as exc:
        raise ParentPulseException("INVALID_DOCUMENT_REFERENCE", "A related document ID is invalid.") from exc
    documents = (await session.execute(select(Document).where(Document.id.in_(document_ids)))).scalars().all()
    if len(documents) != len(set(document_ids)) or any(document.parent_id != parent_id for document in documents):
        raise AuthorizationError("Every related document must belong to the selected parent.")


@router.post("", response_model=ApiResponse[AppointmentResponse])
async def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, member = await verify_parent_access(session, current_user.id, data.parent_id)
    if data.family_id != parent.family_id:
        raise AuthorizationError("The appointment family does not match the selected parent.")
    if not member.can_manage_appointments:
        raise AuthorizationError("Appointment management permission is required.")
    await _verify_appointment_links(
        session,
        data.parent_id,
        data.family_id,
        data.assigned_to_user_id,
        data.related_document_ids,
    )
    service = AppointmentService(session)
    appointment = await service.create_appointment(data)
    return build_response(AppointmentResponse.model_validate(appointment))


@router.get("/parent/{parent_id}", response_model=ApiResponse[list[AppointmentResponse]])
async def list_parent_appointments(
    parent_id: UUID,
    status: str | None = Query(None),
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
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    service = AppointmentService(session)
    existing = await service.app_repo.get_by_id(appointment_id)
    if not existing:
        raise ResourceNotFoundError("Appointment", appointment_id)
    _, member = await verify_parent_access(session, current_user.id, existing.parent_id)
    if not member.can_manage_appointments:
        raise AuthorizationError("Appointment management permission is required.")
    enforce_record_version(existing.updated_at, record_version, conflict_resolution)
    await _verify_appointment_links(
        session,
        existing.parent_id,
        existing.family_id,
        data.assigned_to_user_id,
        data.related_document_ids,
    )
    updated = await service.update_appointment(appointment_id, data)
    return build_response(AppointmentResponse.model_validate(updated))
