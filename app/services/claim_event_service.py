"""Helpers for recording tenant-scoped claim audit events."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim_event import ClaimEvent


async def record_claim_event(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    claim_id: UUID,
    event_type: str,
    actor: str,
    detail_json: dict | None = None,
) -> ClaimEvent:
    event = ClaimEvent(
        tenant_id=tenant_id,
        claim_id=claim_id,
        event_type=event_type,
        actor=actor,
        detail_json=detail_json or {},
    )
    db.add(event)
    await db.flush()
    return event
