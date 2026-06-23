"""Control Plane device registry endpoints (JWT)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant, get_current_user, require_role
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.control import (
    DeviceBulkCreate,
    DeviceBulkCreateResponse,
    DeviceCreate,
    DeviceListResponse,
    DeviceOut,
    DeviceUpdate,
)
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.get("", response_model=DeviceListResponse)
async def list_devices(
    serial_number: str | None = Query(default=None),
    device_category: str | None = Query(default=None),
    batch_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DeviceListResponse:
    devices = await device_service.list_devices(
        db,
        tenant.id,
        serial_number=serial_number,
        device_category=device_category,
        batch_id=batch_id,
        limit=limit,
        offset=offset,
    )
    items = [device_service.device_to_out(d) for d in devices]
    return DeviceListResponse(devices=items, total=len(items))


@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def create_device(
    payload: DeviceCreate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DeviceOut:
    try:
        device = await device_service.create_device(db, tenant_id=tenant.id, payload=payload)
    except device_service.DeviceConflictError as exc:
        raise _error("DEVICE_CONFLICT", str(exc), status.HTTP_409_CONFLICT) from exc
    return device_service.device_to_out(device)


@router.post("/bulk", response_model=DeviceBulkCreateResponse, status_code=status.HTTP_201_CREATED)
async def bulk_create_devices(
    payload: DeviceBulkCreate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DeviceBulkCreateResponse:
    try:
        devices = await device_service.bulk_create_devices(
            db, tenant_id=tenant.id, payload=payload
        )
    except device_service.DeviceConflictError as exc:
        raise _error("DEVICE_CONFLICT", str(exc), status.HTTP_409_CONFLICT) from exc
    items = [device_service.device_to_out(d) for d in devices]
    return DeviceBulkCreateResponse(created=items, total=len(items))


@router.get("/by-serial/{serial_number}", response_model=DeviceOut)
async def get_device_by_serial(
    serial_number: str,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DeviceOut:
    try:
        device = await device_service.get_device_by_serial(db, tenant.id, serial_number)
    except device_service.DeviceNotFoundError as exc:
        raise _error("DEVICE_NOT_FOUND", "Device not found", status.HTTP_404_NOT_FOUND) from exc
    return device_service.device_to_out(device)


@router.get("/{device_id}", response_model=DeviceOut)
async def get_device(
    device_id: UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DeviceOut:
    try:
        device = await device_service.get_device(db, tenant.id, device_id)
    except device_service.DeviceNotFoundError as exc:
        raise _error("DEVICE_NOT_FOUND", "Device not found", status.HTTP_404_NOT_FOUND) from exc
    return device_service.device_to_out(device)


@router.patch("/{device_id}", response_model=DeviceOut)
async def update_device(
    device_id: UUID,
    payload: DeviceUpdate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DeviceOut:
    try:
        device = await device_service.update_device(
            db, tenant_id=tenant.id, device_id=device_id, payload=payload
        )
    except device_service.DeviceNotFoundError as exc:
        raise _error("DEVICE_NOT_FOUND", "Device not found", status.HTTP_404_NOT_FOUND) from exc
    return device_service.device_to_out(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await device_service.delete_device(db, tenant_id=tenant.id, device_id=device_id)
    except device_service.DeviceNotFoundError as exc:
        raise _error("DEVICE_NOT_FOUND", "Device not found", status.HTTP_404_NOT_FOUND) from exc
