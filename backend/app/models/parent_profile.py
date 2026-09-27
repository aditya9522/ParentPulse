# backend/app/models/parent_profile.py
import uuid
from datetime import date
from typing import Optional, List, Any
from sqlalchemy import String, Date, Float, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ParentProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "parent_profiles"

    family_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    blood_group: Mapped[str] = mapped_column(String(10), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    allergies: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    chronic_conditions: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    disabilities: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    surgeries: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    emergency_contacts: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    primary_doctors: Mapped[list[Any]] = mapped_column(JSONB, default=list, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    family: Mapped["Family"] = relationship("Family", back_populates="parents")  # type: ignore
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="parent", cascade="all, delete-orphan")  # type: ignore
    medicines: Mapped[List["Medicine"]] = relationship("Medicine", back_populates="parent", cascade="all, delete-orphan")  # type: ignore
    appointments: Mapped[List["Appointment"]] = relationship("Appointment", back_populates="parent", cascade="all, delete-orphan")  # type: ignore
    measurements: Mapped[List["Measurement"]] = relationship("Measurement", back_populates="parent", cascade="all, delete-orphan")  # type: ignore
    timeline_events: Mapped[List["TimelineEvent"]] = relationship("TimelineEvent", back_populates="parent", cascade="all, delete-orphan")  # type: ignore
