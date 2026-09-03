from uuid import UUID, uuid4

from sqlalchemy import Float, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SalesBonusAward(Base, TimestampMixin):
    """One-time onboarding bonus, awarded once per dealer (audit trail).

    Recorded at the moment a dealer is onboarded so the historical amount
    stays fixed even if the global/per-rep rate changes later.
    """

    __tablename__ = "sales_bonus_awards"
    __table_args__ = (
        UniqueConstraint("tenant_id", name="uq_sales_bonus_awards_tenant"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    sales_rep_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("sales_reps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
