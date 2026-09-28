import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PushDevice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "push_devices"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expo_push_token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    platform: Mapped[str] = mapped_column(String(20))
    device_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
