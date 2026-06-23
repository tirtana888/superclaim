"""Control Plane device registry — all access is tenant-scoped."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import tenant_query
from app.models.device import Device
from app.schemas.control import DeviceBulkCreate, DeviceCreate, DeviceOut, DeviceUpdate


class DeviceNotFoundError(Exception):
    pass


class DeviceConflictError(Exception):
    pass


def device_to_out(device: Device) -> DeviceOut:
    return DeviceOut.model_validate(device)


async def list_devices(
    db: AsyncSession,
    tenant_id: UUID,
    *,
    serial_number: str | None = None,
    device_category: str | None = None,
    batch_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Device]:
    stmt = tenant_query(Device, tenant_id).order_by(Device.serial_number.asc())
    if serial_number:
        stmt = stmt.where(Device.serial_number.ilike(f"%{serial_number.strip()}%"))
    if device_category:
        stmt = stmt.where(Device.device_category == device_category.strip())
    if batch_id:
        stmt = stmt.where(Device.batch_id == batch_id.strip())
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_device(db: AsyncSession, tenant_id: UUID, device_id: UUID) -> Device:
    result = await db.execute(
        tenant_query(Device, tenant_id).where(Device.id == device_id)
    )
    device = result.scalar_one_or_none()
    if device is None:
        raise DeviceNotFoundError(str(device_id))
    return device


async def get_device_by_serial(
    db: AsyncSession, tenant_id: UUID, serial_number: str
) -> Device:
    result = await db.execute(
        tenant_query(Device, tenant_id).where(
            Device.serial_number == serial_number.strip()
        )
    )
    device = result.scalar_one_or_none()
    if device is None:
        raise DeviceNotFoundError(serial_number)
    return device


async def create_device(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    payload: DeviceCreate,
) -> Device:
    device = Device(
        tenant_id=tenant_id,
        serial_number=payload.serial_number.strip(),
        device_category=payload.device_category.strip(),
        device_model=payload.device_model.strip() if payload.device_model else None,
        purchase_date=payload.purchase_date,
        warranty_months=payload.warranty_months,
        customer_ref=payload.customer_ref,
        batch_id=payload.batch_id,
        source=payload.source,
    )
    db.add(device)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise DeviceConflictError(
            f"Serial number '{payload.serial_number}' already exists for this tenant"
        ) from exc
    await db.refresh(device)
    return device


async def bulk_create_devices(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    payload: DeviceBulkCreate,
) -> list[Device]:
    created: list[Device] = []
    for item in payload.devices:
        device = Device(
            tenant_id=tenant_id,
            serial_number=item.serial_number.strip(),
            device_category=item.device_category.strip(),
            device_model=item.device_model.strip() if item.device_model else None,
            purchase_date=item.purchase_date,
            warranty_months=item.warranty_months,
            customer_ref=item.customer_ref,
            batch_id=item.batch_id,
            source=item.source if item.source != "manual" else "import",
        )
        db.add(device)
        created.append(device)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise DeviceConflictError("One or more serial numbers already exist for this tenant") from exc
    for device in created:
        await db.refresh(device)
    return created


async def update_device(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    device_id: UUID,
    payload: DeviceUpdate,
) -> Device:
    device = await get_device(db, tenant_id, device_id)
    data = payload.model_dump(exclude_unset=True)
    if "device_category" in data and data["device_category"] is not None:
        data["device_category"] = data["device_category"].strip()
    if "device_model" in data and data["device_model"] is not None:
        data["device_model"] = data["device_model"].strip()
    for key, value in data.items():
        setattr(device, key, value)
    await db.commit()
    await db.refresh(device)
    return device


async def delete_device(db: AsyncSession, *, tenant_id: UUID, device_id: UUID) -> None:
    device = await get_device(db, tenant_id, device_id)
    await db.delete(device)
    await db.commit()
