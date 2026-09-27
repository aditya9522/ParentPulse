# backend/app/workers/notification_worker.py
from app.core.logging import logger


async def deliver_push_notification_job(user_id: str, payload: dict) -> None:
    logger.info(f"Background worker sending push notification to user {user_id}")
