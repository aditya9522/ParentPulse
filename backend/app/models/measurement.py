# backend/app/models/measurement.py
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDPrimaryKeyMixin


class Measurement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "measurements"

    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("parent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    vital_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value_numeric: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    value_secondary: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    parent: Mapped["ParentProfile"] = relationship("ParentProfile", back_populates="measurements")  # type: ignore
