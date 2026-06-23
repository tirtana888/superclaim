from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

DEVICE_SOURCES = ("manual", "import", "api")


class Device(Base, TimestampMixin):
    __tablename__ = "devices"
    __table_args__ = (
        UniqueConstraint("tenant_id", "serial_number", name="uq_devices_tenant_serial"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    serial_number: Mapped[str] = mapped_column(String(255), nullable=False)
    device_category: Mapped[str] = mapped_column(String(100), nullable=False)
    device_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    warranty_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    batch_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="devices")
    claims: Mapped[list["Claim"]] = relationship("Claim", back_populates="device")
