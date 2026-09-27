# backend/app/services/family_service.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.families import FamilyRepository
from app.crud.users import UserRepository
from app.models.family import Family
from app.models.family_member import FamilyMember
from app.schemas.family import FamilyCreate, FamilyMemberInvite
from app.core.exceptions import ResourceNotFoundError


class FamilyService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.family_repo = FamilyRepository(session)
        self.user_repo = UserRepository(session)

    async def create_family(self, user_id: UUID, data: FamilyCreate) -> Family:
        family = await self.family_repo.create(
            name=data.name,
            created_by=user_id,
        )
        # Add creator as primary family member admin
        await self.family_repo.add_member(
            family_id=family.id,
            user_id=user_id,
            role="family_member",
            relationship="creator",
            can_manage_medicines=True,
            can_manage_appointments=True,
            can_upload_documents=True,
            can_share_doctor_brief=True,
            can_view_location_history=True,
        )
        return await self.get_family_details(family.id)

    async def get_family_details(self, family_id: UUID) -> Family:
        family = await self.family_repo.get_family_with_members(family_id)
        if not family:
            raise ResourceNotFoundError("Family", family_id)
        return family

    async def list_user_families(self, user_id: UUID) -> List[Family]:
        return await self.family_repo.get_user_families(user_id)

    async def invite_member(self, family_id: UUID, invite: FamilyMemberInvite) -> FamilyMember:
        user = await self.user_repo.get_by_email(invite.email)
        if not user:
            user = await self.user_repo.create(
                email=invite.email,
                full_name=invite.email.split("@")[0].capitalize(),
            )

        return await self.family_repo.add_member(
            family_id=family_id,
            user_id=user.id,
            role=invite.role,
            relationship=invite.relationship,
            can_manage_medicines=invite.can_manage_medicines,
            can_manage_appointments=invite.can_manage_appointments,
            can_upload_documents=invite.can_upload_documents,
            can_share_doctor_brief=invite.can_share_doctor_brief,
            can_view_location_history=invite.can_view_location_history,
        )
