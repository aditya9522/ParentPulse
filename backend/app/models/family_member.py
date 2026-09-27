# backend/app/models/family_member.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDPrimaryKeyMixin


class FamilyMember(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "family_members"

    family_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), default="family_member", nullable=False)
    relationship_name: Mapped[str] = mapped_column("relationship", String(100), nullable=False)
    can_manage_medicines: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_manage_appointments: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_upload_documents: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_share_doctor_brief: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_view_location_history: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    family: Mapped["Family"] = relationship("Family", back_populates="members")  # type: ignore
    user: Mapped["User"] = relationship("User", back_populates="family_memberships")  # type: ignore
