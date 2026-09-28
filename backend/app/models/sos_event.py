import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin


class SosEvent(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "sos_events"

    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("parent_profiles.id", ondelete="CASCADE"), index=True)
    family_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), index=True)
    initiated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="active", index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SosAcknowledgement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "sos_acknowledgements"
    __table_args__ = (UniqueConstraint("sos_event_id", "user_id", name="uq_sos_ack_event_user"),)

    sos_event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sos_events.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    response: Mapped[str] = mapped_column(String(30), default="acknowledged")
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
