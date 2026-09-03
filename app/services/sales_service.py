"""Sales service — dealer onboarding, per-dealer revenue, and commission.

Revenue is derived directly from processed claims (``Claim.decision is not
None``), using the same ``BILLABLE_RATE_PER_CLAIM`` constant that drives the
tenant-facing usage/billing rollup (see ``usage_service``). This keeps sales
figures consistent with what a dealer sees on their own Usage page, while
staying flexible to any period granularity (week, month, ...) rather than
being locked to the monthly ``usage_records`` rollup.
"""

from __future__ import annotations

import re
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.claim import Claim
from app.models.commission_settings import CommissionSettings
from app.models.sales_bonus_award import SalesBonusAward
from app.models.sales_rep import SalesRep
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.sales import (
    CommissionRange,
    CommissionSettingsOut,
    CommissionSettingsUpdate,
    CommissionSummaryOut,
    DealerCommissionBreakdown,
    DealerDetailOut,
    DealerOnboardCreated,
    DealerOnboardRequest,
    DealerOut,
    RevenuePoint,
    SalesRepCreate,
    SalesRepCreated,
    SalesRepOut,
    SalesRepUpdate,
)
from app.services.usage_service import BILLABLE_RATE_PER_CLAIM


class DealerNotFoundError(Exception):
    pass


class DealerConflictError(Exception):
    pass


class SalesRepNotFoundError(Exception):
    pass


class SalesRepConflictError(Exception):
    pass


# ---------------------------------------------------------------------------
# Sales rep management (superadmin only)
# ---------------------------------------------------------------------------


async def list_sales_reps(db: AsyncSession) -> list[SalesRepOut]:
    result = await db.execute(select(SalesRep).order_by(SalesRep.created_at.desc()))
    return [SalesRepOut.model_validate(rep) for rep in result.scalars().all()]


async def create_sales_rep(db: AsyncSession, payload: SalesRepCreate) -> SalesRepCreated:
    sales_rep = SalesRep(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
        status="active",
    )
    db.add(sales_rep)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise SalesRepConflictError("A sales rep with this email already exists") from exc
    await db.refresh(sales_rep)
    base = SalesRepOut.model_validate(sales_rep)
    return SalesRepCreated(**base.model_dump(), temporary_password=payload.password)


async def update_sales_rep(
    db: AsyncSession, sales_rep_id: UUID, payload: SalesRepUpdate
) -> SalesRepOut:
    result = await db.execute(select(SalesRep).where(SalesRep.id == sales_rep_id))
    sales_rep = result.scalar_one_or_none()
    if sales_rep is None:
        raise SalesRepNotFoundError(str(sales_rep_id))

    data = payload.model_dump(exclude_unset=True)
    if "status" in data:
        sales_rep.status = data["status"]
    if "onboarding_bonus_override" in data:
        sales_rep.onboarding_bonus_override = data["onboarding_bonus_override"]
    if "revenue_rate_override" in data:
        sales_rep.revenue_rate_override = data["revenue_rate_override"]

    await db.commit()
    await db.refresh(sales_rep)
    return SalesRepOut.model_validate(sales_rep)


async def update_commission_settings(
    db: AsyncSession, payload: CommissionSettingsUpdate
) -> CommissionSettingsOut:
    settings_row = await get_or_create_commission_settings(db)
    data = payload.model_dump(exclude_unset=True)
    if "default_onboarding_bonus" in data and data["default_onboarding_bonus"] is not None:
        settings_row.default_onboarding_bonus = data["default_onboarding_bonus"]
    if "default_revenue_rate" in data and data["default_revenue_rate"] is not None:
        settings_row.default_revenue_rate = data["default_revenue_rate"]
    await db.commit()
    await db.refresh(settings_row)
    return CommissionSettingsOut.model_validate(settings_row)


async def get_sales_rep_or_404(db: AsyncSession, sales_rep_id: UUID) -> SalesRep:
    result = await db.execute(select(SalesRep).where(SalesRep.id == sales_rep_id))
    sales_rep = result.scalar_one_or_none()
    if sales_rep is None:
        raise SalesRepNotFoundError(str(sales_rep_id))
    return sales_rep


# ---------------------------------------------------------------------------
# Commission settings (singleton)
# ---------------------------------------------------------------------------


async def get_or_create_commission_settings(db: AsyncSession) -> CommissionSettings:
    result = await db.execute(select(CommissionSettings).limit(1))
    settings_row = result.scalar_one_or_none()
    if settings_row is None:
        settings_row = CommissionSettings()
        db.add(settings_row)
        await db.commit()
        await db.refresh(settings_row)
    return settings_row


def _effective_bonus(sales_rep: SalesRep, settings_row: CommissionSettings) -> float:
    return (
        sales_rep.onboarding_bonus_override
        if sales_rep.onboarding_bonus_override is not None
        else settings_row.default_onboarding_bonus
    )


def _effective_rate(sales_rep: SalesRep, settings_row: CommissionSettings) -> float:
    return (
        sales_rep.revenue_rate_override
        if sales_rep.revenue_rate_override is not None
        else settings_row.default_revenue_rate
    )


# ---------------------------------------------------------------------------
# Dealer onboarding
# ---------------------------------------------------------------------------


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "dealer"


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug = _slugify(base)
    existing = await db.execute(select(Tenant.id).where(Tenant.slug == slug))
    if existing.scalar_one_or_none() is None:
        return slug
    return f"{slug}-{secrets.token_hex(3)}"


async def onboard_dealer(
    db: AsyncSession, *, sales_rep: SalesRep, payload: DealerOnboardRequest
) -> DealerOnboardCreated:
    slug = await _unique_slug(db, payload.slug or payload.dealer_name)
    temp_password = secrets.token_urlsafe(12)

    tenant = Tenant(
        name=payload.dealer_name.strip(),
        slug=slug,
        status="active",
        plan_tier="trial",
        api_key_hash=secrets.token_hex(32),
        is_active=True,
        onboarded_by_sales_rep_id=sales_rep.id,
    )
    db.add(tenant)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise DealerConflictError("A dealer with this name/slug already exists") from exc

    owner = User(
        tenant_id=tenant.id,
        email=str(payload.owner_email).lower(),
        password_hash=hash_password(temp_password),
        role="owner",
        status="active",
    )
    db.add(owner)

    settings_row = await get_or_create_commission_settings(db)
    bonus_amount = _effective_bonus(sales_rep, settings_row)
    db.add(
        SalesBonusAward(
            sales_rep_id=sales_rep.id,
            tenant_id=tenant.id,
            amount=bonus_amount,
        )
    )

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise DealerConflictError("A user with this email already exists") from exc
    await db.refresh(tenant)

    return DealerOnboardCreated(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        slug=tenant.slug,
        owner_email=owner.email,
        temporary_password=temp_password,
        onboarding_bonus_awarded=bonus_amount,
    )


# ---------------------------------------------------------------------------
# Dealer listing / detail
# ---------------------------------------------------------------------------


def _month_start(reference: datetime | None = None) -> datetime:
    now = reference or datetime.now(UTC)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def list_dealers(db: AsyncSession, sales_rep_id: UUID) -> list[DealerOut]:
    month_start = _month_start()

    total_counts = (
        select(
            Claim.tenant_id,
            func.count(Claim.id).label("total"),
            func.max(Claim.created_at).label("last_claim_at"),
        )
        .where(Claim.decision.is_not(None))
        .group_by(Claim.tenant_id)
        .subquery()
    )
    period_counts = (
        select(Claim.tenant_id, func.count(Claim.id).label("period_total"))
        .where(Claim.decision.is_not(None), Claim.created_at >= month_start)
        .group_by(Claim.tenant_id)
        .subquery()
    )
    stmt = (
        select(
            Tenant,
            func.coalesce(total_counts.c.total, 0).label("claims_processed_total"),
            total_counts.c.last_claim_at,
            func.coalesce(period_counts.c.period_total, 0).label("period_total"),
        )
        .outerjoin(total_counts, total_counts.c.tenant_id == Tenant.id)
        .outerjoin(period_counts, period_counts.c.tenant_id == Tenant.id)
        .where(Tenant.onboarded_by_sales_rep_id == sales_rep_id)
        .order_by(Tenant.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        DealerOut(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug,
            status=tenant.status,
            plan_tier=tenant.plan_tier,
            is_active=tenant.is_active,
            onboarded_at=tenant.created_at,
            claims_processed_total=int(total),
            last_claim_at=last_claim_at,
            revenue_current_period=float(period_total) * BILLABLE_RATE_PER_CLAIM,
        )
        for tenant, total, last_claim_at, period_total in rows
    ]


async def get_dealer_detail(
    db: AsyncSession, *, sales_rep_id: UUID, tenant_id: UUID
) -> DealerDetailOut:
    tenants = await list_dealers(db, sales_rep_id)
    base = next((d for d in tenants if d.id == tenant_id), None)
    if base is None:
        raise DealerNotFoundError(str(tenant_id))

    history_stmt = (
        select(
            func.to_char(Claim.created_at, "YYYY-MM").label("period"),
            func.count(Claim.id).label("claims_processed"),
        )
        .where(Claim.tenant_id == tenant_id, Claim.decision.is_not(None))
        .group_by("period")
        .order_by("period")
    )
    rows = (await db.execute(history_stmt)).all()
    history = [
        RevenuePoint(
            period=row.period,
            claims_processed=int(row.claims_processed),
            revenue=float(row.claims_processed) * BILLABLE_RATE_PER_CLAIM,
        )
        for row in rows
    ]
    return DealerDetailOut(**base.model_dump(), revenue_history=history)


# ---------------------------------------------------------------------------
# Commission
# ---------------------------------------------------------------------------


def _period_bounds(range_: CommissionRange, reference: datetime | None = None) -> tuple[datetime, datetime]:
    now = reference or datetime.now(UTC)
    if range_ == "week":
        return now - timedelta(days=7), now
    return _month_start(now), now


async def compute_commission(
    db: AsyncSession, *, sales_rep: SalesRep, range_: CommissionRange
) -> CommissionSummaryOut:
    period_start, period_end = _period_bounds(range_)
    settings_row = await get_or_create_commission_settings(db)
    rate = _effective_rate(sales_rep, settings_row)

    dealers_result = await db.execute(
        select(Tenant).where(Tenant.onboarded_by_sales_rep_id == sales_rep.id)
    )
    dealers = list(dealers_result.scalars().all())

    breakdown: list[DealerCommissionBreakdown] = []
    total_revenue = 0.0
    total_revenue_commission = 0.0
    total_onboarding_bonus = 0.0

    for tenant in dealers:
        claims_count = (
            await db.execute(
                select(func.count(Claim.id)).where(
                    Claim.tenant_id == tenant.id,
                    Claim.decision.is_not(None),
                    Claim.created_at >= period_start,
                    Claim.created_at <= period_end,
                )
            )
        ).scalar_one()
        revenue = float(claims_count) * BILLABLE_RATE_PER_CLAIM
        revenue_commission = revenue * rate

        bonus_result = await db.execute(
            select(func.coalesce(func.sum(SalesBonusAward.amount), 0.0)).where(
                SalesBonusAward.sales_rep_id == sales_rep.id,
                SalesBonusAward.tenant_id == tenant.id,
                SalesBonusAward.created_at >= period_start,
                SalesBonusAward.created_at <= period_end,
            )
        )
        onboarding_bonus = float(bonus_result.scalar_one())

        if claims_count == 0 and onboarding_bonus == 0.0:
            continue

        breakdown.append(
            DealerCommissionBreakdown(
                tenant_id=tenant.id,
                tenant_name=tenant.name,
                claims_processed=int(claims_count),
                revenue=revenue,
                revenue_commission=revenue_commission,
                onboarding_bonus=onboarding_bonus,
            )
        )
        total_revenue += revenue
        total_revenue_commission += revenue_commission
        total_onboarding_bonus += onboarding_bonus

    return CommissionSummaryOut(
        range=range_,
        period_start=period_start,
        period_end=period_end,
        total_revenue=total_revenue,
        total_revenue_commission=total_revenue_commission,
        total_onboarding_bonus=total_onboarding_bonus,
        total_commission=total_revenue_commission + total_onboarding_bonus,
        dealers=breakdown,
    )
