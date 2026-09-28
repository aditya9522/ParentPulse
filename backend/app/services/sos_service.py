from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.core.permissions import verify_parent_access
from app.models.family_member import FamilyMember
from app.models.notification import Notification
from app.models.push_device import PushDevice
from app.models.sos_event import SosAcknowledgement, SosEvent
from app.services.push_service import expo_push_service


class SosService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def register_device(self, user_id: UUID, token: str, platform: str, device_name: str | None) -> PushDevice:
        existing = (await self.session.execute(select(PushDevice).where(PushDevice.expo_push_token == token))).scalar_one_or_none()
        now = datetime.now(UTC)
        if existing:
            existing.user_id = user_id
            existing.platform = platform
            existing.device_name = device_name
            existing.is_active = True
            existing.last_seen_at = now
            await self.session.flush()
            return existing
        device = PushDevice(user_id=user_id, expo_push_token=token, platform=platform, device_name=device_name, last_seen_at=now)
        self.session.add(device)
        await self.session.flush()
        return device

    async def deactivate_device(self, user_id: UUID, token: str) -> None:
        device = (await self.session.execute(select(PushDevice).where(PushDevice.user_id == user_id, PushDevice.expo_push_token == token))).scalar_one_or_none()
        if device:
            device.is_active = False
            await self.session.flush()

    async def start(self, user_id: UUID, parent_id: UUID, latitude: float | None, longitude: float | None, message: str | None) -> tuple[SosEvent, int, int]:
        parent, _ = await verify_parent_access(self.session, user_id, parent_id)
        active = (await self.session.execute(select(SosEvent).where(SosEvent.parent_id == parent_id, SosEvent.status == "active"))).scalar_one_or_none()
        if active:
            raise ConflictError("An SOS event is already active for this parent.")

        event = SosEvent(parent_id=parent_id, family_id=parent.family_id, initiated_by=user_id, latitude=latitude, longitude=longitude, message=message, status="active")
        self.session.add(event)
        await self.session.flush()

        recipient_ids = list((await self.session.execute(select(FamilyMember.user_id).where(FamilyMember.family_id == parent.family_id, FamilyMember.user_id != user_id))).scalars().all())
        for recipient_id in recipient_ids:
            self.session.add(Notification(user_id=recipient_id, title="Emergency SOS", body="A family member activated an emergency alert.", notification_type="sos", payload={"sos_event_id": str(event.id), "parent_id": str(parent_id)}, is_read=False))
        tokens = list((await self.session.execute(select(PushDevice.expo_push_token).where(PushDevice.user_id.in_(recipient_ids), PushDevice.is_active.is_(True)))).scalars().all()) if recipient_ids else []
        accepted = await expo_push_service.send(tokens, "Emergency SOS", "A family member needs immediate assistance.", {"type": "sos", "sosEventId": str(event.id), "parentId": str(parent_id), "latitude": latitude, "longitude": longitude})
        return event, len(tokens), accepted

    async def acknowledge(self, user_id: UUID, event_id: UUID, response: str) -> int:
        event = await self.get(event_id)
        await verify_parent_access(self.session, user_id, event.parent_id)
        existing = (await self.session.execute(select(SosAcknowledgement).where(SosAcknowledgement.sos_event_id == event_id, SosAcknowledgement.user_id == user_id))).scalar_one_or_none()
        if existing:
            existing.response = response
            existing.acknowledged_at = datetime.now(UTC)
        else:
            self.session.add(SosAcknowledgement(sos_event_id=event_id, user_id=user_id, response=response))
        await self.session.flush()
        return await self.acknowledgement_count(event_id)

    async def resolve(self, user_id: UUID, event_id: UUID) -> SosEvent:
        event = await self.get(event_id)
        await verify_parent_access(self.session, user_id, event.parent_id)
        if event.status != "active":
            raise ConflictError("This SOS event is no longer active.")
        event.status = "resolved"
        event.resolved_at = datetime.now(UTC)
        await self.session.flush()
        return event

    async def get(self, event_id: UUID) -> SosEvent:
        event = await self.session.get(SosEvent, event_id)
        if not event:
            raise ResourceNotFoundError("SOS event", event_id)
        return event

    async def acknowledgement_count(self, event_id: UUID) -> int:
        return int((await self.session.execute(select(func.count()).select_from(SosAcknowledgement).where(SosAcknowledgement.sos_event_id == event_id))).scalar_one())
