# backend/app/api/v1/endpoints/parents.py
from uuid import UUID

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.concurrency import enforce_record_version
from app.core.exceptions import ResourceNotFoundError
from app.core.permissions import verify_family_membership, verify_family_owner
from app.crud.parents import ParentRepository
from app.helpers.response_builder import build_response
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.parent import ParentProfileCreate, ParentProfileResponse, ParentProfileUpdate

router = APIRouter(prefix="/parents", tags=["Parent Profiles"])


@router.post("", response_model=ApiResponse[ParentProfileResponse])
async def create_parent_profile(
    data: ParentProfileCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await verify_family_owner(session, current_user.id, data.family_id)
    repo = ParentRepository(session)
    parent = await repo.create(
        family_id=data.family_id,
        full_name=data.full_name,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        blood_group=data.blood_group,
        preferred_language=data.preferred_language,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        phone_number=data.phone_number,
        allergies=data.allergies,
        chronic_conditions=data.chronic_conditions,
        disabilities=data.disabilities,
        surgeries=[s.model_dump() for s in data.surgeries],
        emergency_contacts=[e.model_dump() for e in data.emergency_contacts],
        primary_doctors=[d.model_dump() for d in data.primary_doctors],
        notes=data.notes,
    )
    return build_response(ParentProfileResponse.model_validate(parent))


@router.get("/family/{family_id}", response_model=ApiResponse[list[ParentProfileResponse]])
async def list_parents_in_family(
    family_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await verify_family_membership(session, current_user.id, family_id)
    repo = ParentRepository(session)
    parents = await repo.get_by_family(family_id)
    return build_response([ParentProfileResponse.model_validate(p) for p in parents])


@router.get("/{parent_id}", response_model=ApiResponse[ParentProfileResponse])
async def get_parent_profile(
    parent_id: UUID,
    context=Depends(get_parent_access_context),
):
    parent, _ = context
    return build_response(ParentProfileResponse.model_validate(parent))


@router.patch("/{parent_id}", response_model=ApiResponse[ParentProfileResponse])
async def update_parent_profile(
    parent_id: UUID,
    data: ParentProfileUpdate,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    parent, _ = context
    enforce_record_version(parent.updated_at, record_version, conflict_resolution)
    repo = ParentRepository(session)
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("surgeries"):
        update_data["surgeries"] = [s.model_dump() if hasattr(s, "model_dump") else s for s in update_data["surgeries"]]
    if update_data.get("emergency_contacts"):
        update_data["emergency_contacts"] = [e.model_dump() if hasattr(e, "model_dump") else e for e in update_data["emergency_contacts"]]
    if update_data.get("primary_doctors"):
        update_data["primary_doctors"] = [d.model_dump() if hasattr(d, "model_dump") else d for d in update_data["primary_doctors"]]

    updated = await repo.update(parent_id, **update_data)
    if not updated:
        raise ResourceNotFoundError("ParentProfile", parent_id)
    return build_response(ParentProfileResponse.model_validate(updated))
