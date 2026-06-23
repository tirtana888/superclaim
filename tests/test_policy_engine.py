from datetime import date
from uuid import uuid4

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.models.policy import Policy
from app.schemas.policy import PolicyConfig
from app.services.policy_engine import (
    _rule_damage_covered,
    _rule_device_covered,
    _rule_warranty_active,
    evaluate_policy,
)


def test_warranty_active_passes_within_period() -> None:
    config = PolicyConfig(warranty_months=12)
    result = _rule_warranty_active(config, date(2024, 1, 1), date(2024, 6, 1))
    assert result.passed is True


def test_warranty_active_fails_after_expiry() -> None:
    config = PolicyConfig(warranty_months=12)
    result = _rule_warranty_active(config, date(2023, 1, 1), date(2025, 6, 1))
    assert result.passed is False


def test_device_covered_matches_category() -> None:
    config = PolicyConfig(covered_device_categories=["smartphone"])
    result = _rule_device_covered(config, "smartphone")
    assert result.passed is True


def test_device_covered_rejects_unknown_category() -> None:
    config = PolicyConfig(covered_device_categories=["smartphone"])
    result = _rule_device_covered(config, "tv")
    assert result.passed is False


def test_damage_covered_from_description() -> None:
    config = PolicyConfig(covered_damage_types=["cracked_screen", "screen"])
    result = _rule_damage_covered(config, "Phone has cracked screen", None)
    assert result.passed is True


def test_damage_covered_rejects_unknown_damage() -> None:
    config = PolicyConfig(covered_damage_types=["water_damage"])
    result = _rule_damage_covered(config, "Minor scratch on case", None)
    assert result.passed is False


@pytest.mark.asyncio
async def test_evaluate_policy_all_rules_pass() -> None:
    tenant_id = uuid4()
    claim_id = uuid4()
    policy_row = Policy(
        id=uuid4(),
        tenant_id=tenant_id,
        external_policy_id="POL-001",
        version=1,
        is_active=True,
        config=PolicyConfig().model_dump(),
    )

    session = AsyncMock()

    async def fake_execute(stmt):
        sql = str(stmt)
        mock_result = MagicMock()
        if "policies" in sql:
            mock_result.scalar_one_or_none.return_value = policy_row
        elif "count" in sql:
            mock_result.scalar_one.return_value = 0
        else:
            mock_result.scalar_one_or_none.return_value = None
        return mock_result

    session.execute = AsyncMock(side_effect=fake_execute)
    session.add = MagicMock()
    session.flush = AsyncMock()

    result = await evaluate_policy(
        session,
        tenant_id=tenant_id,
        claim_id=claim_id,
        external_policy_id="POL-001",
        device_category="smartphone",
        damage_description="Cracked screen",
        purchase_date=date(2024, 6, 1),
        claim_date=date(2025, 3, 1),
        serial_number="SN123456",
    )

    assert result.covered is True
    assert result.rule_fired is None
    assert len(result.rules) == 5
    assert session.add.call_count == 5
    for call in session.add.call_args_list:
        log = call.args[0]
        assert getattr(log, "tenant_id", None) == tenant_id


@pytest.mark.asyncio
async def test_evaluate_policy_fails_device_not_covered() -> None:
    tenant_id = uuid4()
    claim_id = uuid4()

    session = AsyncMock()
    session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: None, scalar_one=lambda: 0)
    )
    session.add = MagicMock()
    session.flush = AsyncMock()

    result = await evaluate_policy(
        session,
        tenant_id=tenant_id,
        claim_id=claim_id,
        external_policy_id=None,
        device_category="television",
        damage_description="Cracked screen",
        purchase_date=date(2024, 6, 1),
        claim_date=date(2025, 3, 1),
        serial_number="SN123456",
    )

    assert result.covered is False
    assert result.rule_fired == "device_covered"
