from app.schemas.decision import ClaimDecisionResult
from app.schemas.duplicate import DuplicateAnalysisResult
from app.schemas.fraud import FraudAnalysisResult
from app.schemas.ocr import OcrAnalysisResult
from app.schemas.policy import PolicyEvaluationResult, RuleResult
from app.schemas.vision import VisionAnalysisResult
from app.services.decision_service import build_decision


def _policy(covered: bool = True, rule_fired: str | None = None) -> PolicyEvaluationResult:
    return PolicyEvaluationResult(
        covered=covered,
        rule_fired=rule_fired,
        rules=[RuleResult(rule_id="warranty_active", passed=covered, reason="test")],
    )


def _duplicate(score: float = 0.0, is_dup: bool = False) -> DuplicateAnalysisResult:
    return DuplicateAnalysisResult(is_duplicate=is_dup, duplicate_score=score)


def _fraud(score: float) -> FraudAnalysisResult:
    return FraudAnalysisResult(
        fraud_score=score,
        risk_level="low",
        model_source="test",
    )


def _vision(confidence: float = 0.9) -> VisionAnalysisResult:
    return VisionAnalysisResult(
        damage_type="cracked_screen",
        damage_severity="moderate",
        device_identified="iPhone",
        confidence=confidence,
        ai_cost_usd=0.01,
    )


def _ocr(confidence: float = 0.9) -> OcrAnalysisResult:
    return OcrAnalysisResult(
        best_match="SN123",
        match_with_input=True,
        confidence=confidence,
        ai_cost_usd=0.001,
    )


def test_build_decision_auto_approve() -> None:
    result = build_decision(
        external_claim_id="CLM-001",
        policy_result=_policy(),
        duplicate_result=_duplicate(),
        fraud_result=_fraud(0.1),
        vision_result=_vision(0.95),
        ocr_result=_ocr(),
        processing_time_ms=1200,
    )
    assert result.decision == "APPROVE"
    assert result.ai_cost_usd == 0.011
    assert result.requires_human_review is False


def test_build_decision_reject_policy() -> None:
    result = build_decision(
        external_claim_id="CLM-002",
        policy_result=_policy(covered=False, rule_fired="device_covered"),
        duplicate_result=_duplicate(),
        fraud_result=_fraud(0.1),
        vision_result=_vision(),
        ocr_result=_ocr(),
        processing_time_ms=900,
    )
    assert result.decision == "REJECT"
    assert any(reason.code == "POLICY_NOT_COVERED" for reason in result.reasons)


def test_build_decision_reject_duplicate() -> None:
    result = build_decision(
        external_claim_id="CLM-003",
        policy_result=_policy(),
        duplicate_result=_duplicate(score=0.98, is_dup=True),
        fraud_result=_fraud(0.2),
        vision_result=_vision(),
        ocr_result=_ocr(),
        processing_time_ms=800,
    )
    assert result.decision == "REJECT"
    assert result.duplicate_detected is True


def test_build_decision_reject_fraud() -> None:
    result = build_decision(
        external_claim_id="CLM-004",
        policy_result=_policy(),
        duplicate_result=_duplicate(),
        fraud_result=_fraud(0.9),
        vision_result=_vision(),
        ocr_result=_ocr(),
        processing_time_ms=700,
    )
    assert result.decision == "REJECT"


def test_build_decision_review() -> None:
    result = build_decision(
        external_claim_id="CLM-005",
        policy_result=_policy(),
        duplicate_result=_duplicate(),
        fraud_result=_fraud(0.5),
        vision_result=_vision(confidence=0.7),
        ocr_result=_ocr(),
        processing_time_ms=600,
    )
    assert result.decision == "REVIEW"
    assert result.requires_human_review is True
