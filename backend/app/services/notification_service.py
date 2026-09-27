# backend/app/services/notification_service.py
from uuid import UUID
from typing import Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def send_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        notification_type: str,
        payload: dict[str, Any] = {},
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            payload=payload,
        )
        self.session.add(notif)
        await self.session.flush()
        return notif

    async def list_user_notifications(self, user_id: UUID) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
