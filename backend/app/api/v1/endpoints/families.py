# backend/app/api/v1/endpoints/families.py
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.core.permissions import verify_family_membership, verify_family_owner
from app.helpers.response_builder import build_response
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.family import (
    FamilyCreate,
    FamilyMemberInvite,
    FamilyMemberResponse,
    FamilyMemberUpdate,
    FamilyResponse,
)
from app.services.family_service import FamilyService

router = APIRouter(prefix="/families", tags=["Families"])


@router.post("", response_model=ApiResponse[FamilyResponse])
async def create_family(
    data: FamilyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = FamilyService(session)
    family = await service.create_family(current_user.id, data)
    return build_response(FamilyResponse.model_validate(family))


@router.get("", response_model=ApiResponse[list[FamilyResponse]])
async def list_my_families(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = FamilyService(session)
    families = await service.list_user_families(current_user.id)
    return build_response([FamilyResponse.model_validate(f) for f in families])


@router.get("/{family_id}", response_model=ApiResponse[FamilyResponse])
async def get_family_details(
    family_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await verify_family_membership(session, current_user.id, family_id)
    service = FamilyService(session)
    family = await service.get_family_details(family_id)
    return build_response(FamilyResponse.model_validate(family))


@router.post("/{family_id}/members", response_model=ApiResponse[FamilyMemberResponse])
async def invite_family_member(
    family_id: UUID,
    invite: FamilyMemberInvite,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await verify_family_owner(session, current_user.id, family_id)
    service = FamilyService(session)
    member = await service.invite_member(family_id, invite, current_user.id)
    return build_response(FamilyMemberResponse.model_validate(member))


@router.patch("/{family_id}/members/{member_id}", response_model=ApiResponse[FamilyMemberResponse])
async def update_family_member(
    family_id: UUID,
    member_id: UUID,
    data: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    family = await verify_family_owner(session, current_user.id, family_id)
    member = await FamilyService(session).update_member(family, member_id, data, current_user.id)
    return build_response(FamilyMemberResponse.model_validate(member))


@router.delete(
    "/{family_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def remove_family_member(
    family_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    family = await verify_family_owner(session, current_user.id, family_id)
    await FamilyService(session).remove_member(family, member_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
