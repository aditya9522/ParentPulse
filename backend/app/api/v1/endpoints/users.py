# backend/app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.crud.users import UserRepository

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
