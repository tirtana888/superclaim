"""Sales rep schemas — dealer onboarding, revenue, and commission."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

CommissionRange = Literal["week", "month"]


class SalesRepOut(BaseModel):
    id: UUID
    name: str
    email: str
    status: str
    onboarding_bonus_override: float | None = None
    revenue_rate_override: float | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class SalesRepCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class SalesRepUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=50)
    onboarding_bonus_override: float | None = None
    revenue_rate_override: float | None = None


class SalesRepCreated(SalesRepOut):
    """Returned once at creation — includes temporary password for first login."""

    temporary_password: str


class CommissionSettingsOut(BaseModel):
    default_onboarding_bonus: float
    default_revenue_rate: float
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CommissionSettingsUpdate(BaseModel):
    default_onboarding_bonus: float | None = Field(default=None, ge=0)
    default_revenue_rate: float | None = Field(default=None, ge=0, le=1)


# ---- Dealer onboarding ----


class DealerOnboardRequest(BaseModel):
    dealer_name: str = Field(..., min_length=2, max_length=255)
    owner_email: EmailStr
    slug: str | None = Field(default=None, max_length=255)


class DealerOnboardCreated(BaseModel):
    tenant_id: UUID
    tenant_name: str
    slug: str | None = None
    owner_email: str
    temporary_password: str
    onboarding_bonus_awarded: float


class DealerOut(BaseModel):
    id: UUID
    name: str
    slug: str | None = None
    status: str
    plan_tier: str
    is_active: bool
    onboarded_at: datetime | None = None
    claims_processed_total: int = 0
    last_claim_at: datetime | None = None
    revenue_current_period: float = 0.0


class DealerListResponse(BaseModel):
    dealers: list[DealerOut]
    total: int


class RevenuePoint(BaseModel):
    period: str
    claims_processed: int
    revenue: float


class DealerDetailOut(DealerOut):
    revenue_history: list[RevenuePoint] = Field(default_factory=list)


# ---- Commission ----


class DealerCommissionBreakdown(BaseModel):
    tenant_id: UUID
    tenant_name: str
    claims_processed: int
    revenue: float
    revenue_commission: float
    onboarding_bonus: float


class CommissionSummaryOut(BaseModel):
    range: CommissionRange
    period_start: datetime
    period_end: datetime
    total_revenue: float
    total_revenue_commission: float
    total_onboarding_bonus: float
    total_commission: float
    dealers: list[DealerCommissionBreakdown] = Field(default_factory=list)
