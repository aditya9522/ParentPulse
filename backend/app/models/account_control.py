import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin


class ConsentEvent(Base, UUIDPrimaryKeyMixin):
    """Append-only evidence of a user's privacy choice."""

    __tablename__ = "consent_events"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    consent_type: Mapped[str] = mapped_column(String(60), index=True)
    granted: Mapped[bool] = mapped_column(Boolean)
    policy_version: Mapped[str] = mapped_column(String(30))
    source: Mapped[str] = mapped_column(String(30), default="mobile_settings")
    context: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )


class DeletedIdentity(Base):
    """A minimal tombstone that prevents a deleted Auth identity being recreated."""

    __tablename__ = "deleted_identities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    deleted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    auth_cleanup_status: Mapped[str] = mapped_column(String(30), default="pending")
    cleanup_context: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
