from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Claim(Base, TimestampMixin):
    __tablename__ = "claims"
    __table_args__ = (
        UniqueConstraint("tenant_id", "external_claim_id", name="uq_claims_tenant_external_id"),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    external_claim_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    device_category: Mapped[str | None] = mapped_column(String(100))
    serial_number_input: Mapped[str | None] = mapped_column(String(255))
    purchase_date: Mapped[date | None] = mapped_column(Date)
    claim_date: Mapped[date | None] = mapped_column(Date)
    damage_description: Mapped[str | None] = mapped_column(Text)
    policy_id: Mapped[str | None] = mapped_column(String(255))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="claims")
