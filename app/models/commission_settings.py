from uuid import UUID, uuid4

from sqlalchemy import Float
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

DEFAULT_ONBOARDING_BONUS = 50.0
DEFAULT_REVENUE_RATE = 0.05  # 5% of dealer revenue, recurring


class CommissionSettings(Base, TimestampMixin):
    """Global sales commission configuration — singleton row, superadmin-only."""

    __tablename__ = "commission_settings"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    default_onboarding_bonus: Mapped[float] = mapped_column(
        Float, default=DEFAULT_ONBOARDING_BONUS, nullable=False
    )
    default_revenue_rate: Mapped[float] = mapped_column(
        Float, default=DEFAULT_REVENUE_RATE, nullable=False
    )
