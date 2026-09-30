# backend/app/models/medicine.py
import uuid
from datetime import date, datetime
from typing import Optional, Any, List
from sqlalchemy import String, Integer, Date, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Medicine(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "medicines"

    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("parent_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    family_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    form: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency_times_per_day: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    schedule_times: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    instructions: Mapped[str] = mapped_column(String(50), default="after_food", nullable=False)
    prescribing_doctor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    current_inventory: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    refill_alert_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    parent: Mapped["ParentProfile"] = relationship("ParentProfile", back_populates="medicines")  # type: ignore
    dose_logs: Mapped[List["MedicineDoseLog"]] = relationship("MedicineDoseLog", back_populates="medicine", cascade="all, delete-orphan")  # type: ignore


class MedicineDoseLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "medicine_dose_logs"

    medicine_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("parent_profiles.id", ondelete="CASCADE"), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="scheduled", nullable=False)
    recorded_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    recorded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    medicine: Mapped["Medicine"] = relationship("Medicine", back_populates="dose_logs")  # type: ignore
