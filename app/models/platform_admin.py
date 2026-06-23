from uuid import UUID, uuid4

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

PLATFORM_ADMIN_STATUSES = ("active", "disabled")


class PlatformAdmin(Base, TimestampMixin):
    """Platform-level operator (superadmin) — not bound to any tenant."""

    __tablename__ = "platform_admins"
    __table_args__ = (UniqueConstraint("email", name="uq_platform_admins_email"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
