from uuid import UUID, uuid4

from sqlalchemy import Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class UsageRecord(Base, TimestampMixin):
    """Monthly usage rollup per tenant (billing)."""

    __tablename__ = "usage_records"
    __table_args__ = (
        UniqueConstraint("tenant_id", "period", name="uq_usage_records_tenant_period"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    claims_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_cost_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    billable_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="usage_records")
