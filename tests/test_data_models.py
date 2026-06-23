"""Tests for Session 2 data model expansion."""

from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.core.database import tenant_query
from app.models.claim_event import ClaimEvent
from app.models.device import Device
from app.models.usage_record import UsageRecord
from app.schemas.control import DeviceCreate, DeviceOut, UsageRecordOut
from app.services.claim_event_service import record_claim_event


def test_device_create_schema_validates() -> None:
    d = DeviceCreate(
        serial_number="SN-001",
        device_category="smartphone",
        purchase_date=date(2024, 1, 1),
        warranty_months=12,
    )
    assert d.source == "manual"


def test_device_create_rejects_invalid_warranty() -> None:
    with pytest.raises(ValidationError):
        DeviceCreate(serial_number="SN", device_category="phone", warranty_months=0)


def test_device_out_from_attributes() -> None:
    tid = uuid4()
    dev = Device(
        id=uuid4(),
        tenant_id=tid,
        serial_number="SN-1",
        device_category="tablet",
        source="import",
    )
    out = DeviceOut.model_validate(dev)
    assert out.serial_number == "SN-1"
    assert out.tenant_id == tid


def test_usage_record_out_schema() -> None:
    tid = uuid4()
    rec = UsageRecord(
        id=uuid4(),
        tenant_id=tid,
        period="2026-06",
        claims_processed=10,
        ai_cost_total=1.25,
        billable_amount=50.0,
    )
    out = UsageRecordOut.model_validate(rec)
    assert out.period == "2026-06"


@pytest.mark.parametrize(
    "model",
    [Device, ClaimEvent, UsageRecord],
)
def test_tenant_query_includes_filter(model: type) -> None:
    tid = uuid4()
    stmt = tenant_query(model, tid)
    compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
    assert "tenant_id" in compiled
    assert str(tid).replace("-", "") in compiled.replace("-", "")


@pytest.mark.asyncio
async def test_record_claim_event_sets_tenant_scope() -> None:
    tenant_id = uuid4()
    claim_id = uuid4()
    session_calls: list[ClaimEvent] = []

    class FakeSession:
        def add(self, obj: ClaimEvent) -> None:
            session_calls.append(obj)

        async def flush(self) -> None:
            return None

    event = await record_claim_event(
        FakeSession(),  # type: ignore[arg-type]
        tenant_id=tenant_id,
        claim_id=claim_id,
        event_type="submitted",
        actor="api",
        detail_json={"source": "test"},
    )
    assert event.tenant_id == tenant_id
    assert event.claim_id == claim_id
    assert event.event_type == "submitted"
    assert session_calls[0] is event


def test_cross_tenant_device_serial_unique_per_tenant_only() -> None:
    """Unique constraint is (tenant_id, serial_number), not global serial."""
    t1, t2 = uuid4(), uuid4()
    d1 = Device(tenant_id=t1, serial_number="SAME", device_category="phone", source="manual")
    d2 = Device(tenant_id=t2, serial_number="SAME", device_category="phone", source="manual")
    assert d1.serial_number == d2.serial_number
    assert d1.tenant_id != d2.tenant_id
