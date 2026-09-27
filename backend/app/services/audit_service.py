# backend/app/services/audit_service.py
from uuid import UUID
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.audit_logs import AuditLogRepository
from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.audit_repo = AuditLogRepository(session)

    async def log_event(
        self,
        user_id: Optional[UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[UUID] = None,
        metadata: dict[str, Any] = {},
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        return await self.audit_repo.create(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=metadata,
            ip_address=ip_address,
        )
