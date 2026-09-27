# backend/app/crud/families.py
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories import BaseRepository
from app.models.family import Family
from app.models.family_member import FamilyMember


class FamilyRepository(BaseRepository[Family]):
    def __init__(self, session: AsyncSession):
        super().__init__(Family, session)

    async def get_family_with_members(self, family_id: UUID) -> Optional[Family]:
        stmt = (
            select(Family)
            .where(Family.id == family_id)
            .options(selectinload(Family.members).selectinload(FamilyMember.user))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_families(self, user_id: UUID) -> List[Family]:
        stmt = (
            select(Family)
            .join(FamilyMember, FamilyMember.family_id == Family.id)
            .where(FamilyMember.user_id == user_id)
            .options(selectinload(Family.members).selectinload(FamilyMember.user))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_member(
        self,
        family_id: UUID,
        user_id: UUID,
        role: str,
        relationship: str,
        can_manage_medicines: bool = True,
        can_manage_appointments: bool = True,
        can_upload_documents: bool = True,
        can_share_doctor_brief: bool = False,
        can_view_location_history: bool = True,
    ) -> FamilyMember:
        member = FamilyMember(
            family_id=family_id,
            user_id=user_id,
            role=role,
            relationship_name=relationship,
            can_manage_medicines=can_manage_medicines,
            can_manage_appointments=can_manage_appointments,
            can_upload_documents=can_upload_documents,
            can_share_doctor_brief=can_share_doctor_brief,
            can_view_location_history=can_view_location_history,
        )
        self.session.add(member)
        await self.session.flush()
        return member
