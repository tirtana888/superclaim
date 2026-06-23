"""Platform admin API (superadmin) — cross-tenant management."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
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
from app.services import admin_service

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
