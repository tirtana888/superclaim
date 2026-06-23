"""Platform admin service — cross-tenant operations (superadmin only)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.admin import (
    PlatformStatsOut,
    TenantAdminDetail,
    TenantAdminOut,
    TenantAdminUpdate,
    TenantUserAdminOut,
)


class AdminNotFoundError(Exception):
    pass


async def list_tenants(db: AsyncSession) -> list[TenantAdminOut]:
    user_counts = (
        select(User.tenant_id, func.count(User.id).label("user_count"))
        .group_by(User.tenant_id)
        .subquery()
    )
    claim_counts = (
        select(Claim.tenant_id, func.count(Claim.id).label("claim_count"))
        .group_by(Claim.tenant_id)
        .subquery()
    )
    stmt = (
        select(
            Tenant,
            func.coalesce(user_counts.c.user_count, 0).label("user_count"),
            func.coalesce(claim_counts.c.claim_count, 0).label("claim_count"),
        )
        .outerjoin(user_counts, user_counts.c.tenant_id == Tenant.id)
        .outerjoin(claim_counts, claim_counts.c.tenant_id == Tenant.id)
        .order_by(Tenant.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        TenantAdminOut(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug,
            status=tenant.status,
            plan_tier=tenant.plan_tier,
            is_active=tenant.is_active,
            user_count=int(user_count),
            claim_count=int(claim_count),
            created_at=tenant.created_at,
        )
        for tenant, user_count, claim_count in rows
    ]


async def get_tenant(db: AsyncSession, tenant_id: UUID) -> TenantAdminDetail:
    tenants = await list_tenants(db)
    for row in tenants:
        if row.id == tenant_id:
            return TenantAdminDetail.model_validate(row)
    raise AdminNotFoundError("Tenant not found")


async def update_tenant(
    db: AsyncSession, tenant_id: UUID, payload: TenantAdminUpdate
) -> TenantAdminDetail:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise AdminNotFoundError("Tenant not found")

    if payload.status is not None:
        tenant.status = payload.status
    if payload.plan_tier is not None:
        tenant.plan_tier = payload.plan_tier
    if payload.is_active is not None:
        tenant.is_active = payload.is_active

    await db.commit()
    await db.refresh(tenant)
    return await get_tenant(db, tenant_id)


async def list_tenant_users(db: AsyncSession, tenant_id: UUID) -> list[TenantUserAdminOut]:
    result = await db.execute(
        select(User).where(User.tenant_id == tenant_id).order_by(User.created_at.desc())
    )
    return [TenantUserAdminOut.model_validate(u) for u in result.scalars().all()]


async def get_platform_stats(db: AsyncSession) -> PlatformStatsOut:
    tenant_count = (await db.execute(select(func.count(Tenant.id)))).scalar_one()
    active_tenant_count = (
        await db.execute(select(func.count(Tenant.id)).where(Tenant.is_active.is_(True)))
    ).scalar_one()
    user_count = (await db.execute(select(func.count(User.id)))).scalar_one()
    claim_count = (await db.execute(select(func.count(Claim.id)))).scalar_one()
    return PlatformStatsOut(
        tenant_count=int(tenant_count),
        active_tenant_count=int(active_tenant_count),
        user_count=int(user_count),
        claim_count=int(claim_count),
    )
