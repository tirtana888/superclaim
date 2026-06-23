"""Tests for result_adapters and unified data plane auth."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.schemas.decision import ClaimDecisionResult, DecisionReason
from app.schemas.policy import PolicyEvaluationResult, RuleResult
from app.security import get_authenticated_context, hash_api_key
from app.services.result_adapters import analysis_to_storage_dict, decision_to_analysis


def test_decision_to_analysis_roundtrip_fields() -> None:
    legacy = ClaimDecisionResult(
        claim_id="CLM-1",
        decision="REJECT",
        confidence_score=0.5,
        fraud_score=0.8,
        reasons=[DecisionReason(code="X", description="y", severity="high")],
        policy_result={
            "covered": False,
            "rules": [RuleResult(rule_id="r1", passed=False, reason="nope").model_dump()],
            "policy_version": 2,
        },
        duplicate_detected=True,
        requires_human_review=True,
        processing_time_ms=100,
        ai_cost_usd=0.01,
    )
    canonical = decision_to_analysis(legacy)
    storage = analysis_to_storage_dict(canonical)
    assert storage["decision"] == "REJECT"
    assert storage["duplicate_detected"] is True
    assert storage["policy_result"]["rules"][0]["rule_id"] == "r1"


@pytest.mark.asyncio
async def test_unified_auth_legacy_headers() -> None:
    from app.models.tenant import Tenant

    tenant_id = uuid4()
    tenant = Tenant(
        id=tenant_id,
        name="T",
        api_key_hash=hash_api_key("secret"),
        is_active=True,
    )
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: tenant))
    session.flush = AsyncMock()

    ctx = await get_authenticated_context(
        db=session,
        x_api_key="secret",
        x_tenant_id=str(tenant_id),
        x_api_key_id=None,
        x_api_secret=None,
    )
    assert ctx.tenant.tenant_id == tenant_id
