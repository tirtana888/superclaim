from uuid import UUID, uuid4

from sqlalchemy import Float, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

SALES_REP_STATUSES = ("active", "disabled")


class SalesRep(Base, TimestampMixin):
    """Internal SuperClaim sales staff — not bound to any tenant.

    Onboards new dealers (tenants) and earns commission on the revenue
    those dealers generate. Accounts are created and managed exclusively
    by platform superadmin (no self-signup).
    """

    __tablename__ = "sales_reps"
    __table_args__ = (UniqueConstraint("email", name="uq_sales_reps_email"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    # Per-rep overrides; NULL falls back to the global CommissionSettings defaults.
    onboarding_bonus_override: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_rate_override: Mapped[float | None] = mapped_column(Float, nullable=True)

    dealers: Mapped[list["Tenant"]] = relationship(
        "Tenant",
        back_populates="onboarded_by",
    )
