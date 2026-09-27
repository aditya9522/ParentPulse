# backend/app/models/family.py
import uuid
from typing import List
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Family(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "families"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    members: Mapped[List["FamilyMember"]] = relationship("FamilyMember", back_populates="family", cascade="all, delete-orphan")  # type: ignore
    parents: Mapped[List["ParentProfile"]] = relationship("ParentProfile", back_populates="family", cascade="all, delete-orphan")  # type: ignore
