# backend/app/services/sharing_service.py
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, ResourceNotFoundError
from app.crud.documents import DocumentRepository
from app.crud.medicines import MedicineRepository
from app.crud.parents import ParentRepository
from app.crud.sharing import ShareRepository
from app.models.measurement import Measurement
from app.models.share import Share
from app.schemas.sharing import DoctorBriefResponse
from app.utils.hashing import generate_secure_token


class SharingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.share_repo = ShareRepository(session)
        self.parent_repo = ParentRepository(session)
        self.med_repo = MedicineRepository(session)
        self.doc_repo = DocumentRepository(session)

    async def create_doctor_share(
        self,
        parent_id: UUID,
        user_id: UUID,
        share_scope: str = "summary_only",
        expires_in_hours: int = 72,
    ) -> Share:
        token = generate_secure_token(24)
        expires_at = datetime.now(UTC) + timedelta(hours=expires_in_hours)
        return await self.share_repo.create(
            parent_id=parent_id,
            token=token,
            share_scope=share_scope,
            expires_at=expires_at,
            created_by=user_id,
        )

    async def get_doctor_brief_by_token(self, token: str) -> DoctorBriefResponse:
        share = await self.share_repo.get_by_token(token)
        if not share or share.is_revoked:
            raise AuthenticationError("Doctor share link is invalid or has been revoked.")

        now = datetime.now(UTC)
        if share.expires_at < now:
            raise AuthenticationError("Doctor share link has expired.")

        # Increment access count
        await self.share_repo.update(share.id, access_count=share.access_count + 1)

        parent = await self.parent_repo.get_by_id(share.parent_id)
        if not parent:
            raise ResourceNotFoundError("ParentProfile", share.parent_id)

        medicines = await self.med_repo.list_by_parent(parent.id, active_only=True)
        documents = await self.doc_repo.list_by_parent(parent.id)

        # Calculate age
        today = datetime.now(UTC).date()
        age = today.year - parent.date_of_birth.year

        active_meds = [
            {"name": m.name, "dosage": m.dosage, "instructions": m.instructions}
            for m in medicines
        ]

        document_limit = 5 if share.share_scope == "summary_only" else len(documents)
        recent_reports = [
            {"title": d.title, "date": str(d.document_date), "summary": d.summary or ""}
            for d in documents[:document_limit]
        ]

        vital_result = await self.session.execute(
            select(Measurement)
            .where(Measurement.parent_id == parent.id)
            .order_by(Measurement.recorded_at.desc())
            .limit(10 if share.share_scope == "full_history" else 3)
        )
        recent_vitals = []
        for vital in vital_result.scalars().all():
            value = str(vital.value_numeric)
            if vital.value_secondary is not None:
                value = f"{value}/{vital.value_secondary}"
            recent_vitals.append({
                "vital_type": vital.vital_type,
                "value": f"{value} {vital.unit}",
                "date": vital.recorded_at.isoformat(),
            })

        return DoctorBriefResponse(
            parent_name=parent.full_name,
            age=age,
            blood_group=parent.blood_group,
            allergies=parent.allergies,
            chronic_conditions=parent.chronic_conditions,
            active_medicines=active_meds,
            recent_reports=recent_reports,
            recent_vitals=recent_vitals,
            emergency_contacts=parent.emergency_contacts,
            generated_at=now,
        )
