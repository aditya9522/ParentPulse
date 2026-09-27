# backend/app/api/v1/endpoints/notifications.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ApiResponse[List[dict]])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = NotificationService(session)
    notifs = await service.list_user_notifications(current_user.id)
    return build_response([
        {
            "id": str(n.id),
            "title": n.title,
            "body": n.body,
            "notification_type": n.notification_type,
            "payload": n.payload,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ])
