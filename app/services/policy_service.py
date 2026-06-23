"""Control Plane policy CRUD — all access is tenant-scoped."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import tenant_query
from app.models.policy import Policy
from app.schemas.policy import PolicyConfig, PolicyCreate, PolicyOut, PolicyUpdate


class PolicyNotFoundError(Exception):
    pass


class PolicyStateError(Exception):
    pass


def _rules_dict(rules: PolicyConfig) -> dict:
    return rules.model_dump()


def policy_to_out(policy: Policy) -> PolicyOut:
    rules = policy.rules_json if policy.rules_json else policy.config
    return PolicyOut(
        id=policy.id,
        tenant_id=policy.tenant_id,
        external_policy_id=policy.external_policy_id,
        name=policy.name or policy.external_policy_id,
        version=policy.version,
        status=policy.status,
        is_active=policy.is_active,
        rules_json=rules,
        effective_from=policy.effective_from,
        created_by=policy.created_by,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


def _generate_external_policy_id() -> str:
    return f"POL-{secrets.token_hex(4).upper()}"


async def _next_version(db: AsyncSession, tenant_id: UUID, external_policy_id: str) -> int:
    result = await db.execute(
        select(func.max(Policy.version)).where(
            Policy.tenant_id == tenant_id,
            Policy.external_policy_id == external_policy_id,
        )
    )
    current = result.scalar_one_or_none()
    return (current or 0) + 1


async def list_policies(
    db: AsyncSession,
    tenant_id: UUID,
    *,
    status: str | None = None,
) -> list[Policy]:
    stmt = tenant_query(Policy, tenant_id).order_by(
        Policy.external_policy_id.asc(),
        Policy.version.desc(),
    )
    if status is not None:
        stmt = stmt.where(Policy.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_policy(db: AsyncSession, tenant_id: UUID, policy_id: UUID) -> Policy:
    result = await db.execute(
        tenant_query(Policy, tenant_id).where(Policy.id == policy_id)
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        raise PolicyNotFoundError(str(policy_id))
    return policy


async def create_policy(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    created_by: UUID,
    payload: PolicyCreate,
) -> Policy:
    external_id = (payload.external_policy_id or _generate_external_policy_id()).strip()
    version = await _next_version(db, tenant_id, external_id)
    rules = _rules_dict(payload.rules_json)

    policy = Policy(
        tenant_id=tenant_id,
        external_policy_id=external_id,
        name=payload.name.strip(),
        version=version,
        status="draft",
        is_active=False,
        config=rules,
        rules_json=rules,
        effective_from=payload.effective_from,
        created_by=created_by,
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


async def update_policy(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    policy_id: UUID,
    payload: PolicyUpdate,
) -> Policy:
    policy = await get_policy(db, tenant_id, policy_id)
    if policy.status != "draft":
        raise PolicyStateError("Only draft policies can be updated")

    if payload.name is not None:
        policy.name = payload.name.strip()
    if payload.rules_json is not None:
        rules = _rules_dict(payload.rules_json)
        policy.rules_json = rules
        policy.config = rules
    if payload.effective_from is not None:
        policy.effective_from = payload.effective_from

    await db.commit()
    await db.refresh(policy)
    return policy


async def activate_policy(db: AsyncSession, *, tenant_id: UUID, policy_id: UUID) -> Policy:
    policy = await get_policy(db, tenant_id, policy_id)
    if policy.status != "draft":
        raise PolicyStateError("Only draft policies can be activated")

    now = datetime.now(UTC)
    await db.execute(
        update(Policy)
        .where(
            Policy.tenant_id == tenant_id,
            Policy.external_policy_id == policy.external_policy_id,
            Policy.id != policy.id,
        )
        .values(status="archived", is_active=False)
    )

    policy.status = "active"
    policy.is_active = True
    if policy.effective_from is None:
        policy.effective_from = now

    await db.commit()
    await db.refresh(policy)
    return policy


async def archive_policy(db: AsyncSession, *, tenant_id: UUID, policy_id: UUID) -> Policy:
    policy = await get_policy(db, tenant_id, policy_id)
    if policy.status == "archived":
        raise PolicyStateError("Policy is already archived")

    policy.status = "archived"
    policy.is_active = False
    await db.commit()
    await db.refresh(policy)
    return policy


async def create_policy_version(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    created_by: UUID,
    source_policy_id: UUID,
) -> Policy:
    source = await get_policy(db, tenant_id, source_policy_id)
    version = await _next_version(db, tenant_id, source.external_policy_id)
    rules = source.rules_json if source.rules_json else source.config

    policy = Policy(
        tenant_id=tenant_id,
        external_policy_id=source.external_policy_id,
        name=source.name or source.external_policy_id,
        version=version,
        status="draft",
        is_active=False,
        config=dict(rules),
        rules_json=dict(rules),
        effective_from=None,
        created_by=created_by,
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


async def delete_policy(db: AsyncSession, *, tenant_id: UUID, policy_id: UUID) -> None:
    policy = await get_policy(db, tenant_id, policy_id)
    if policy.status != "draft":
        raise PolicyStateError("Only draft policies can be deleted")
    await db.delete(policy)
    await db.commit()
