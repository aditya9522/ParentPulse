# backend/app/services/family_service.py
import asyncio
from typing import Any, cast
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.supabase import get_supabase_client
from app.core.exceptions import AuthorizationError, ConflictError, ResourceNotFoundError
from app.crud.families import FamilyRepository
from app.crud.users import UserRepository
from app.models.family import Family
from app.models.family_member import FamilyMember
from app.schemas.family import FamilyCreate, FamilyMemberInvite, FamilyMemberUpdate
from app.services.audit_service import AuditService


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

    async def list_user_families(self, user_id: UUID) -> list[Family]:
        return await self.family_repo.get_user_families(user_id)

    async def invite_member(
        self,
        family_id: UUID,
        invite: FamilyMemberInvite,
        actor_id: UUID,
    ) -> FamilyMember:
        email = str(invite.email)
        user = await self.user_repo.get_by_email(email)
        if not user:
            metadata = {
                key: value
                for key, value in {
                    "full_name": invite.full_name,
                    "phone_number": invite.phone_number,
                }.items()
                if value
            }
            options = {"data": metadata} if metadata else None
            auth_response = await asyncio.to_thread(
                get_supabase_client().auth.admin.invite_user_by_email, email, cast(Any, options)
            )
            if not auth_response.user:
                raise RuntimeError("Supabase did not create the invited identity")
            user = await self.user_repo.create(
                id=UUID(str(auth_response.user.id)),
                email=email,
                full_name=invite.full_name or email.split("@")[0].capitalize(),
                phone_number=invite.phone_number,
            )

        if await self.family_repo.get_member_by_user(family_id, user.id):
            raise ConflictError("This person is already a member of the care circle.")

        member = await self.family_repo.add_member(
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
        await AuditService(self.session).log_event(
            user_id=actor_id,
            action="family_member.invited",
            resource_type="family_member",
            resource_id=member.id,
            metadata={"family_id": str(family_id), "invited_user_id": str(user.id)},
        )
        await self.session.flush()
        created_member = await self.family_repo.get_member_with_user(family_id, member.id)
        if not created_member:
            raise ResourceNotFoundError("Family member", member.id)
        return created_member

    async def update_member(
        self,
        family: Family,
        member_id: UUID,
        data: FamilyMemberUpdate,
        actor_id: UUID,
    ) -> FamilyMember:
        member = await self.family_repo.get_member_with_user(family.id, member_id)
        if not member:
            raise ResourceNotFoundError("Family member", member_id)
        if member.user_id == family.created_by:
            raise AuthorizationError("The family owner's access cannot be changed.")

        changes = data.model_dump(exclude_unset=True)
        relationship = changes.pop("relationship", None)
        if relationship is not None:
            member.relationship_name = relationship.strip()
        for field, value in changes.items():
            setattr(member, field, value)
        await self.session.flush()
        await AuditService(self.session).log_event(
            user_id=actor_id,
            action="family_member.updated",
            resource_type="family_member",
            resource_id=member.id,
            metadata={"family_id": str(family.id), "changed_fields": sorted(data.model_fields_set)},
        )
        await self.session.flush()
        updated_member = await self.family_repo.get_member_with_user(family.id, member.id)
        if not updated_member:
            raise ResourceNotFoundError("Family member", member.id)
        return updated_member

    async def remove_member(
        self,
        family: Family,
        member_id: UUID,
        actor_id: UUID,
    ) -> None:
        member = await self.family_repo.get_member_with_user(family.id, member_id)
        if not member:
            raise ResourceNotFoundError("Family member", member_id)
        if member.user_id == family.created_by:
            raise AuthorizationError("The family owner cannot be removed from their care circle.")

        removed_user_id = member.user_id
        await self.session.delete(member)
        await self.session.flush()
        await AuditService(self.session).log_event(
            user_id=actor_id,
            action="family_member.removed",
            resource_type="family_member",
            resource_id=member_id,
            metadata={"family_id": str(family.id), "removed_user_id": str(removed_user_id)},
        )
