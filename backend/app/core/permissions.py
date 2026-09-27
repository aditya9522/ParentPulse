# backend/app/core/permissions.py
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.exceptions import AuthorizationError
from app.models.family_member import FamilyMember
from app.models.parent_profile import ParentProfile


async def verify_family_membership(
    session: AsyncSession,
    user_id: UUID,
    family_id: UUID,
) -> FamilyMember:
    stmt = select(FamilyMember).where(
        FamilyMember.family_id == family_id,
        FamilyMember.user_id == user_id,
    )
    result = await session.execute(stmt)
    member = result.scalar_one_or_none()
    if not member:
        raise AuthorizationError("User is not an active member of this family.")
    return member


async def verify_parent_access(
    session: AsyncSession,
    user_id: UUID,
    parent_id: UUID,
) -> tuple[ParentProfile | None, FamilyMember | None]:
    # First get parent profile to find family_id
    stmt_parent = select(ParentProfile).where(ParentProfile.id == parent_id)
    res_parent = await session.execute(stmt_parent)
    parent = res_parent.scalar_one_or_none()
    if not parent:
        # In development/demo, allow fallback to seeded parent profiles
        return None, None

    try:
        member = await verify_family_membership(session, user_id, parent.family_id)
        return parent, member
    except AuthorizationError:
        return parent, None

