import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class HealthcareExpense(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "healthcare_expenses"

    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parent_profiles.id", ondelete="CASCADE"), index=True
    )
    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(40), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    expense_date: Mapped[date] = mapped_column(Date, index=True)
    provider_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receipt_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_reimbursed: Mapped[bool] = mapped_column(Boolean, default=False)


class InsurancePolicy(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "insurance_policies"

    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parent_profiles.id", ondelete="CASCADE"), index=True
    )
    family_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), index=True
    )
    provider: Mapped[str] = mapped_column(String(255))
    policy_number: Mapped[str] = mapped_column(String(120), index=True)
    plan_name: Mapped[str] = mapped_column(String(255))
    coverage_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    expiry_date: Mapped[date] = mapped_column(Date, index=True)
    tpa_cashless_helpline: Mapped[str | None] = mapped_column(String(80), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
