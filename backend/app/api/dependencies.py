# backend/app/api/dependencies.py
import uuid
from typing import AsyncIterator, Tuple
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db_session
from app.core.security import verify_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.crud.users import UserRepository
from app.core.permissions import verify_parent_access, verify_family_membership
from app.models.user import User
from app.models.family_member import FamilyMember
from app.models.parent_profile import ParentProfile


async def get_db() -> AsyncIterator[AsyncSession]:
    async for session in get_db_session():
        yield session


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    session: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid Authorization header format. Expected 'Bearer <token>'.")

    token = authorization.replace("Bearer ", "").strip()
    payload = await verify_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError("Token payload missing subject.")

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationError("Invalid user UUID in token.")

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_uuid)
    if not user:
        # Auto-create if token was validly decoded in dev/staging
        user = await user_repo.create(
            id=user_uuid,
            email=payload.get("email", f"{user_uuid}@example.com"),
            full_name=payload.get("email", "Family Member").split("@")[0].capitalize(),
            preferred_language="en",
        )
    return user


async def get_optional_current_user(
    authorization: str = Header(None, description="Optional Bearer <token>"),
    session: AsyncSession = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.replace("Bearer ", "").strip()
        payload = await verify_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_uuid = uuid.UUID(user_id_str)
        user_repo = UserRepository(session)
        return await user_repo.get_by_id(user_uuid)
    except Exception:
        return None


async def get_parent_access_context(
    parent_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> Tuple[ParentProfile, FamilyMember]:
    return await verify_parent_access(session, user.id, parent_id)
