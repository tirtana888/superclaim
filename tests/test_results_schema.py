"""Tests for the canonical cross-service result contract (app/schemas/results.py).

These lock the shared shapes every service must use. If a field changes here,
every consumer must change in the same session.
"""

import pytest
from pydantic import ValidationError

from app.schemas.results import (
    ClaimAnalysisResult,
    ClaimFeatures,
    ClaimInput,
    DuplicateResult,
    FraudResult,
    OCRResult,
    PolicyResult,
    ReasonItem,
    RuleOutcome,
    VisionResult,
)


def test_vision_result_defaults_and_bounds() -> None:
    result = VisionResult(
        damage_type="cracked_screen",
        damage_severity="moderate",
        confidence=0.9,
    )
    assert result.device_identified is None
    assert result.ai_cost_usd == 0.0

    with pytest.raises(ValidationError):
        VisionResult(damage_type="x", damage_severity="moderate", confidence=1.5)

    with pytest.raises(ValidationError):
        VisionResult(damage_type="x", damage_severity="invalid", confidence=0.5)


def test_ocr_result_defaults() -> None:
    result = OCRResult(confidence=0.0)
    assert result.serial_numbers_found == []
    assert result.matches_input is False
    assert result.best_match is None


def test_duplicate_result_defaults() -> None:
    result = DuplicateResult()
    assert result.is_duplicate is False
    assert result.similar_claim_ids == []
    assert result.exif_flags == []


def test_policy_result_with_rules() -> None:
    result = PolicyResult(
        covered=False,
        policy_version=2,
        rules=[RuleOutcome(rule_id="warranty_active", passed=False, reason="expired")],
    )
    assert result.covered is False
    assert result.rules[0].rule_id == "warranty_active"


def test_fraud_result_risk_level_literal() -> None:
    FraudResult(fraud_score=0.2, risk_level="low")
    with pytest.raises(ValidationError):
        FraudResult(fraud_score=0.2, risk_level="extreme")
    with pytest.raises(ValidationError):
        FraudResult(fraud_score=2.0, risk_level="low")


def test_claim_input_optional_fields() -> None:
    claim = ClaimInput(external_claim_id="CLM-1", device_category="smartphone")
    assert claim.serial_number_input is None
    assert claim.purchase_date is None


def test_claim_features_defaults() -> None:
    features = ClaimFeatures()
    assert features.user_claim_count_30d == 0
    assert features.has_exif is False


def test_claim_analysis_result_full_roundtrip() -> None:
    result = ClaimAnalysisResult(
        claim_id="CLM-1",
        decision="REJECT",
        confidence_score=0.4,
        fraud_score=0.3,
        requires_human_review=False,
        reasons=[ReasonItem(code="POLICY_NOT_COVERED", description="warranty expired", severity="high")],
        vision_result=VisionResult(
            damage_type="none", damage_severity="none", confidence=0.9
        ),
        ocr_result=OCRResult(confidence=0.0),
        policy_result=PolicyResult(covered=False, policy_version=1),
        duplicate_result=DuplicateResult(),
    )

    dumped = result.model_dump()
    restored = ClaimAnalysisResult.model_validate(dumped)
    assert restored.decision == "REJECT"
    assert restored.reasons[0].code == "POLICY_NOT_COVERED"
    assert restored.vision_result is not None
    assert restored.vision_result.damage_severity == "none"


def test_claim_analysis_result_decision_literal() -> None:
    with pytest.raises(ValidationError):
        ClaimAnalysisResult(
            claim_id="CLM-1",
            decision="MAYBE",
            confidence_score=0.4,
            fraud_score=0.3,
            requires_human_review=False,
        )
