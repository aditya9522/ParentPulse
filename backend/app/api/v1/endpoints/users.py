# backend/app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.crud.users import UserRepository
from app.helpers.response_builder import build_response
from app.models.user import User
from app.schemas.account_control import (
    AccountExport,
    AuthMethodsResponse,
    ConsentResponse,
    ConsentType,
    ConsentUpdate,
    DeleteAccountRequest,
    DeleteAccountResponse,
    DeletionImpact,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services.account_control_service import (
    append_consent,
    build_account_export,
    current_consents,
    delete_account,
    deletion_impact,
    get_auth_methods,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return build_response(UserResponse.model_validate(current_user))


@router.patch("/me", response_model=ApiResponse[UserResponse])
async def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    repo = UserRepository(session)
    updated = await repo.update(current_user.id, **data.model_dump(exclude_unset=True))
    return build_response(UserResponse.model_validate(updated))


@router.get("/me/consents", response_model=ApiResponse[list[ConsentResponse]])
async def get_my_consents(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    events = await current_consents(session, current_user.id)
    return build_response([ConsentResponse.model_validate(event, from_attributes=True) for event in events])


@router.put("/me/consents/{consent_type}", response_model=ApiResponse[ConsentResponse])
async def update_my_consent(
    consent_type: ConsentType,
    data: ConsentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    event = await append_consent(
        session, current_user.id, consent_type, data.granted, data.policy_version
    )
    return build_response(ConsentResponse.model_validate(event, from_attributes=True))


@router.get("/me/export", response_model=ApiResponse[AccountExport])
async def export_my_account(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    return build_response(AccountExport.model_validate(await build_account_export(session, current_user)))


@router.get("/me/deletion-impact", response_model=ApiResponse[DeletionImpact])
async def get_my_deletion_impact(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    return build_response(DeletionImpact.model_validate(await deletion_impact(session, current_user.id)))


@router.get("/me/auth-methods", response_model=ApiResponse[AuthMethodsResponse])
async def get_my_auth_methods(current_user: User = Depends(get_current_user)):
    methods = await get_auth_methods(current_user.id)
    return build_response(AuthMethodsResponse(methods=methods))


@router.delete("/me", response_model=ApiResponse[DeleteAccountResponse])
async def delete_my_account(
    data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    cleanup_status = await delete_account(
        session,
        current_user,
        credential_type=data.credential_type,
        confirmation=data.confirmation,
        password=data.password,
        google_id_token=data.google_id_token,
    )
    return build_response(
        DeleteAccountResponse(
            deleted=True,
            auth_cleanup_status="completed" if cleanup_status == "completed" else "pending",
        )
    )
