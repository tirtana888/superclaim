"""Platform admin API (superadmin) — cross-tenant management."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_platform_admin
from app.database import get_db
from app.models.platform_admin import PlatformAdmin
from app.schemas.admin import (
    PlatformStatsOut,
    TenantAdminDetail,
    TenantAdminOut,
    TenantAdminUpdate,
    TenantUserAdminOut,
)
from app.schemas.sales import (
    CommissionSettingsOut,
    CommissionSettingsUpdate,
    CommissionSummaryOut,
    DealerOut,
    SalesRepCreate,
    SalesRepCreated,
    SalesRepOut,
    SalesRepUpdate,
)
from app.services import admin_service, sales_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.get("/stats", response_model=PlatformStatsOut)
async def platform_stats(
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> PlatformStatsOut:
    return await admin_service.get_platform_stats(db)


@router.get("/tenants", response_model=dict[str, list[TenantAdminOut]])
async def list_tenants(
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[TenantAdminOut]]:
    tenants = await admin_service.list_tenants(db)
    return {"tenants": tenants}


@router.get("/tenants/{tenant_id}", response_model=TenantAdminDetail)
async def get_tenant(
    tenant_id: UUID,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> TenantAdminDetail:
    try:
        return await admin_service.get_tenant(db, tenant_id)
    except admin_service.AdminNotFoundError as exc:
        raise _error("TENANT_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc


@router.patch("/tenants/{tenant_id}", response_model=TenantAdminDetail)
async def update_tenant(
    tenant_id: UUID,
    payload: TenantAdminUpdate,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> TenantAdminDetail:
    try:
        return await admin_service.update_tenant(db, tenant_id, payload)
    except admin_service.AdminNotFoundError as exc:
        raise _error("TENANT_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc


@router.get("/tenants/{tenant_id}/users", response_model=dict[str, list[TenantUserAdminOut]])
async def list_tenant_users(
    tenant_id: UUID,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[TenantUserAdminOut]]:
    try:
        await admin_service.get_tenant(db, tenant_id)
    except admin_service.AdminNotFoundError as exc:
        raise _error("TENANT_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc
    users = await admin_service.list_tenant_users(db, tenant_id)
    return {"users": users}


# ---------------------------------------------------------------------------
# Sales reps & commission (superadmin backoffice)
# ---------------------------------------------------------------------------


@router.get("/sales-reps", response_model=dict[str, list[SalesRepOut]])
async def list_sales_reps(
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[SalesRepOut]]:
    reps = await sales_service.list_sales_reps(db)
    return {"sales_reps": reps}


@router.post("/sales-reps", response_model=SalesRepCreated, status_code=status.HTTP_201_CREATED)
async def create_sales_rep(
    payload: SalesRepCreate,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> SalesRepCreated:
    try:
        return await sales_service.create_sales_rep(db, payload)
    except sales_service.SalesRepConflictError as exc:
        raise _error("SALES_REP_CONFLICT", str(exc), status.HTTP_409_CONFLICT) from exc


@router.patch("/sales-reps/{sales_rep_id}", response_model=SalesRepOut)
async def update_sales_rep(
    sales_rep_id: UUID,
    payload: SalesRepUpdate,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> SalesRepOut:
    try:
        return await sales_service.update_sales_rep(db, sales_rep_id, payload)
    except sales_service.SalesRepNotFoundError as exc:
        raise _error("SALES_REP_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc


@router.get("/sales-reps/{sales_rep_id}/dealers", response_model=dict[str, list[DealerOut]])
async def list_sales_rep_dealers(
    sales_rep_id: UUID,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[DealerOut]]:
    try:
        await sales_service.get_sales_rep_or_404(db, sales_rep_id)
    except sales_service.SalesRepNotFoundError as exc:
        raise _error("SALES_REP_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc
    dealers = await sales_service.list_dealers(db, sales_rep_id)
    return {"dealers": dealers}


@router.get("/sales-reps/{sales_rep_id}/commission", response_model=CommissionSummaryOut)
async def get_sales_rep_commission(
    sales_rep_id: UUID,
    range: Literal["week", "month"] = Query(default="month"),
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> CommissionSummaryOut:
    try:
        sales_rep = await sales_service.get_sales_rep_or_404(db, sales_rep_id)
    except sales_service.SalesRepNotFoundError as exc:
        raise _error("SALES_REP_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc
    return await sales_service.compute_commission(db, sales_rep=sales_rep, range_=range)


@router.get("/commission-settings", response_model=CommissionSettingsOut)
async def get_commission_settings(
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> CommissionSettingsOut:
    settings_row = await sales_service.get_or_create_commission_settings(db)
    return CommissionSettingsOut.model_validate(settings_row)


@router.patch("/commission-settings", response_model=CommissionSettingsOut)
async def update_commission_settings(
    payload: CommissionSettingsUpdate,
    _: PlatformAdmin = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
) -> CommissionSettingsOut:
    return await sales_service.update_commission_settings(db, payload)
