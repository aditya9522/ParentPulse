# backend/app/api/dependencies.py
import uuid
from collections.abc import AsyncIterator

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.permissions import verify_parent_access
from app.core.security import verify_access_token
from app.crud.users import UserRepository
from app.db.session import get_db_session
from app.models.account_control import DeletedIdentity
from app.models.family_member import FamilyMember
from app.models.parent_profile import ParentProfile
from app.models.user import User


async def get_db() -> AsyncIterator[AsyncSession]:
    async for session in get_db_session():
        yield session


async def get_current_user(
    authorization: str | None = Header(None, description="Bearer <token>"),
    session: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
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

    deleted_identity = await session.scalar(
        select(DeletedIdentity).where(DeletedIdentity.id == user_uuid)
    )
    if deleted_identity:
        raise AuthenticationError("This account has been deleted.")

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_uuid)
    if not user:
        email = payload.get("email")
        if not isinstance(email, str) or not email.strip():
            raise AuthenticationError("Verified account is missing an email address.")
        raw_metadata = payload.get("user_metadata")
        metadata: dict[str, object] = raw_metadata if isinstance(raw_metadata, dict) else {}
        full_name = metadata.get("full_name") or metadata.get("name") or email.split("@", 1)[0]
        user = await user_repo.create(
            id=user_uuid,
            email=email.strip().lower(),
            full_name=str(full_name).strip(),
            preferred_language="en",
        )
    if not user.is_active:
        raise AuthenticationError("This account is no longer active.")
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
        deleted_identity = await session.scalar(
            select(DeletedIdentity).where(DeletedIdentity.id == user_uuid)
        )
        if deleted_identity:
            return None
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(user_uuid)
        return user if user and user.is_active else None
    except (AuthenticationError, ValueError):
        return None


async def get_parent_access_context(
    parent_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> tuple[ParentProfile, FamilyMember]:
    return await verify_parent_access(session, user.id, parent_id)
