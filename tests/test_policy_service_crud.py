"""Unit tests for policy_service CRUD logic."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.policy import Policy
from app.schemas.policy import PolicyConfig, PolicyCreate, PolicyUpdate
from app.services import policy_service


def _policy(**kwargs) -> Policy:
    defaults = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "external_policy_id": "POL-TEST",
        "name": "Test Policy",
        "version": 1,
        "status": "draft",
        "is_active": False,
        "config": PolicyConfig().model_dump(),
        "rules_json": PolicyConfig().model_dump(),
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    defaults.update(kwargs)
    return Policy(**defaults)


@pytest.mark.asyncio
async def test_get_policy_not_found_raises() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: None)
    )
    with pytest.raises(policy_service.PolicyNotFoundError):
        await policy_service.get_policy(session, uuid4(), uuid4())


@pytest.mark.asyncio
async def test_update_policy_rejects_non_draft() -> None:
    policy = _policy(status="active", is_active=True)
    session = AsyncMock()
    session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: policy)
    )
    with pytest.raises(policy_service.PolicyStateError):
        await policy_service.update_policy(
            session,
            tenant_id=policy.tenant_id,
            policy_id=policy.id,
            payload=PolicyUpdate(name="New Name"),
        )


@pytest.mark.asyncio
async def test_activate_sets_active_and_archives_siblings() -> None:
    tenant_id = uuid4()
    policy_id = uuid4()
    draft = _policy(id=policy_id, tenant_id=tenant_id, status="draft", version=2)

    session = AsyncMock()
    session.execute = AsyncMock(
        side_effect=[
            MagicMock(scalar_one_or_none=lambda: draft),  # get_policy
            MagicMock(),  # update siblings
        ]
    )
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    result = await policy_service.activate_policy(session, tenant_id=tenant_id, policy_id=policy_id)

    assert result.status == "active"
    assert result.is_active is True
    assert result.effective_from is not None
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_policy_sets_rules_on_config_and_rules_json() -> None:
    tenant_id = uuid4()
    user_id = uuid4()
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: 0))
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    payload = PolicyCreate(
        name="Warranty Standard",
        external_policy_id="POL-NEW",
        rules_json=PolicyConfig(warranty_months=24),
    )
    await policy_service.create_policy(
        session, tenant_id=tenant_id, created_by=user_id, payload=payload
    )

    added = session.add.call_args.args[0]
    assert added.tenant_id == tenant_id
    assert added.status == "draft"
    assert added.config["warranty_months"] == 24
    assert added.rules_json["warranty_months"] == 24


def test_policy_to_out_prefers_rules_json() -> None:
    policy = _policy(
        rules_json={"warranty_months": 18},
        config={"warranty_months": 12},
    )
    out = policy_service.policy_to_out(policy)
    assert out.rules_json["warranty_months"] == 18
