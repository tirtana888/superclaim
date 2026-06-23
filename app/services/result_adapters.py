"""Map legacy service schemas to canonical app/schemas/results.py types."""

from __future__ import annotations

from app.schemas.decision import ClaimDecisionResult, DecisionReason
from app.schemas.duplicate import DuplicateAnalysisResult
from app.schemas.fraud import FraudAnalysisResult
from app.schemas.ocr import OcrAnalysisResult
from app.schemas.policy import PolicyEvaluationResult, RuleResult
from app.schemas.results import (
    ClaimAnalysisResult,
    DuplicateResult,
    FraudResult,
    OCRResult,
    PolicyResult,
    ReasonItem,
    RuleOutcome,
    VisionResult,
)
from app.schemas.vision import VisionAnalysisResult


def to_vision_result(result: VisionAnalysisResult) -> VisionResult:
    return VisionResult(
        damage_type=result.damage_type,
        damage_severity=result.damage_severity,
        device_identified=result.device_identified or None,
        confidence=result.confidence,
        ai_cost_usd=result.ai_cost_usd,
    )


def to_ocr_result(result: OcrAnalysisResult) -> OCRResult:
    return OCRResult(
        serial_numbers_found=result.serial_numbers_found,
        best_match=result.best_match,
        matches_input=bool(result.match_with_input),
        confidence=result.confidence,
        ai_cost_usd=result.ai_cost_usd,
    )


def to_duplicate_result(result: DuplicateAnalysisResult) -> DuplicateResult:
    flags = [
        f.code if hasattr(f, "code") else str(f)
        for f in result.exif_flags
    ]
    return DuplicateResult(
        is_duplicate=result.is_duplicate,
        similar_claim_ids=result.similar_claim_ids,
        max_similarity=result.duplicate_score,
        exif_flags=flags,
    )


def to_policy_result(result: PolicyEvaluationResult) -> PolicyResult:
    return PolicyResult(
        covered=result.covered,
        rules=[
            RuleOutcome(rule_id=r.rule_id, passed=r.passed, reason=r.reason)
            for r in result.rules
        ],
        policy_version=result.policy_version or 1,
    )


def to_fraud_result(result: FraudAnalysisResult) -> FraudResult:
    risk = result.risk_level
    if risk not in ("low", "medium", "high"):
        risk = "high" if result.fraud_score > 0.7 else "medium" if result.fraud_score > 0.4 else "low"
    return FraudResult(
        fraud_score=result.fraud_score,
        risk_level=risk,  # type: ignore[arg-type]
        feature_contributions=dict(result.feature_contributions),
    )


def decision_to_analysis(result: ClaimDecisionResult) -> ClaimAnalysisResult:
    policy_rules = result.policy_result.get("rules", []) if result.policy_result else []
    rules: list[RuleOutcome] = []
    for item in policy_rules:
        if isinstance(item, dict):
            rules.append(
                RuleOutcome(
                    rule_id=str(item.get("rule_id", "")),
                    passed=bool(item.get("passed")),
                    reason=str(item.get("reason", "")),
                )
            )

    vision = result.vision_result or {}
    ocr = result.ocr_result or {}
    policy = result.policy_result or {}

    return ClaimAnalysisResult(
        claim_id=result.claim_id,
        decision=result.decision,
        confidence_score=result.confidence_score,
        fraud_score=result.fraud_score,
        requires_human_review=result.requires_human_review,
        reasons=[
            ReasonItem(code=r.code, description=r.description, severity=r.severity)
            for r in result.reasons
        ],
        vision_result=VisionResult(**vision) if vision else None,
        ocr_result=OCRResult(
            serial_numbers_found=ocr.get("serial_numbers_found", []),
            best_match=ocr.get("best_match"),
            matches_input=bool(ocr.get("match_with_input")),
            confidence=float(ocr.get("confidence", 0)),
            ai_cost_usd=float(ocr.get("ai_cost_usd", 0)),
        )
        if ocr
        else None,
        policy_result=PolicyResult(
            covered=bool(policy.get("covered", False)),
            rules=rules,
            policy_version=int(policy.get("policy_version", 1)),
        )
        if policy
        else None,
        duplicate_result=DuplicateResult(is_duplicate=result.duplicate_detected),
        ai_cost_usd=result.ai_cost_usd,
        processing_time_ms=result.processing_time_ms,
    )


def analysis_to_storage_dict(result: ClaimAnalysisResult) -> dict:
    """Dashboard-compatible storage (legacy flat dict + canonical fields)."""
    legacy = ClaimDecisionResult(
        claim_id=result.claim_id,
        decision=result.decision,
        confidence_score=result.confidence_score,
        fraud_score=result.fraud_score,
        reasons=[
            DecisionReason(code=r.code, description=r.description, severity=r.severity)
            for r in result.reasons
        ],
        vision_result=result.vision_result.model_dump() if result.vision_result else {},
        ocr_result=result.ocr_result.model_dump() if result.ocr_result else {},
        policy_result=result.policy_result.model_dump() if result.policy_result else {},
        duplicate_detected=result.duplicate_result.is_duplicate if result.duplicate_result else False,
        processing_time_ms=result.processing_time_ms,
        requires_human_review=result.requires_human_review,
        ai_cost_usd=result.ai_cost_usd,
    )
    data = legacy.model_dump()
    if result.ocr_result:
        ocr_dict = result.ocr_result.model_dump()
        ocr_dict["match_with_input"] = ocr_dict.get("matches_input", False)
        data["ocr_result"] = ocr_dict
    if result.policy_result:
        policy_dict = result.policy_result.model_dump()
        failed = next((r for r in result.policy_result.rules if not r.passed), None)
        policy_dict["rule_fired"] = failed.rule_id if failed else None
        data["policy_result"] = policy_dict
    data["duplicate_result"] = (
        result.duplicate_result.model_dump() if result.duplicate_result else {}
    )
    return data
