"""Unit tests for device_service."""

from datetime import date
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.device import Device
from app.schemas.control import DeviceCreate, DeviceUpdate
from app.services import device_service


def _device(**kwargs) -> Device:
    defaults = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "serial_number": "SN-100",
        "device_category": "smartphone",
        "source": "manual",
    }
    defaults.update(kwargs)
    return Device(**defaults)


@pytest.mark.asyncio
async def test_get_device_not_found() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: None))
    with pytest.raises(device_service.DeviceNotFoundError):
        await device_service.get_device(session, uuid4(), uuid4())


@pytest.mark.asyncio
async def test_create_device_duplicate_serial_raises_conflict() -> None:
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock(side_effect=IntegrityError("insert", {}, Exception()))
    session.rollback = AsyncMock()

    with pytest.raises(device_service.DeviceConflictError):
        await device_service.create_device(
            session,
            tenant_id=uuid4(),
            payload=DeviceCreate(serial_number="SN-DUP", device_category="phone"),
        )
    session.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_device_applies_patch() -> None:
    device = _device()
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: device))
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    updated = await device_service.update_device(
        session,
        tenant_id=device.tenant_id,
        device_id=device.id,
        payload=DeviceUpdate(device_category="tablet", warranty_months=24),
    )
    assert updated.device_category == "tablet"
    assert updated.warranty_months == 24


def test_device_to_out_maps_fields() -> None:
    dev = _device(
        purchase_date=date(2024, 5, 1),
        warranty_months=12,
        batch_id="BATCH-1",
    )
    out = device_service.device_to_out(dev)
    assert out.serial_number == "SN-100"
    assert out.batch_id == "BATCH-1"
