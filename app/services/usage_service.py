"""Usage billing rollup per tenant."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import tenant_query
from app.models.usage_record import UsageRecord
from app.schemas.control import UsageRecordOut

BILLABLE_RATE_PER_CLAIM = 0.50  # USD placeholder for trial tier


class UsageNotFoundError(Exception):
    pass


def usage_to_out(record: UsageRecord) -> UsageRecordOut:
    return UsageRecordOut.model_validate(record)


def _current_period() -> str:
    return datetime.now(UTC).strftime("%Y-%m")


async def get_usage(
    db: AsyncSession, tenant_id: UUID, period: str | None = None
) -> UsageRecord:
    target = period or _current_period()
    result = await db.execute(
        tenant_query(UsageRecord, tenant_id).where(UsageRecord.period == target)
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise UsageNotFoundError(target)
    return record


async def list_usage(db: AsyncSession, tenant_id: UUID, limit: int = 12) -> list[UsageRecord]:
    result = await db.execute(
        tenant_query(UsageRecord, tenant_id)
        .order_by(UsageRecord.period.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def record_claim_processed(
    db: AsyncSession, *, tenant_id: UUID, ai_cost_usd: float
) -> UsageRecord:
    period = _current_period()
    result = await db.execute(
        tenant_query(UsageRecord, tenant_id).where(UsageRecord.period == period)
    )
    record = result.scalar_one_or_none()
    if record is None:
        record = UsageRecord(
            tenant_id=tenant_id,
            period=period,
            claims_processed=0,
            ai_cost_total=0.0,
            billable_amount=0.0,
        )
        db.add(record)

    record.claims_processed += 1
    record.ai_cost_total = float(record.ai_cost_total) + ai_cost_usd
    record.billable_amount = float(record.billable_amount) + BILLABLE_RATE_PER_CLAIM
    await db.flush()
    return record
