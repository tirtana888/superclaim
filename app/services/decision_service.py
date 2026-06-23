import logging
import time

from app.schemas.decision import ClaimDecisionResult, DecisionReason
from app.schemas.duplicate import DuplicateAnalysisResult
from app.schemas.fraud import FraudAnalysisResult
from app.schemas.ocr import OcrAnalysisResult
from app.schemas.policy import PolicyEvaluationResult
from app.schemas.vision import VisionAnalysisResult

logger = logging.getLogger(__name__)

DUPLICATE_REJECT_THRESHOLD = 0.95
FRAUD_REJECT_THRESHOLD = 0.85
FRAUD_APPROVE_THRESHOLD = 0.30
VISION_APPROVE_THRESHOLD = 0.80


def build_decision(
    *,
    external_claim_id: str,
    policy_result: PolicyEvaluationResult,
    duplicate_result: DuplicateAnalysisResult,
    fraud_result: FraudAnalysisResult,
    vision_result: VisionAnalysisResult | None,
    ocr_result: OcrAnalysisResult | None,
    processing_time_ms: int,
) -> ClaimDecisionResult:
    reasons: list[DecisionReason] = []
    ai_cost_usd = 0.0
    if vision_result:
        ai_cost_usd += vision_result.ai_cost_usd
    if ocr_result:
        ai_cost_usd += ocr_result.ai_cost_usd

    if not policy_result.covered:
        reasons.append(
            DecisionReason(
                code="POLICY_NOT_COVERED",
                description=f"Policy rule failed: {policy_result.rule_fired}",
                severity="high",
            )
        )

    if duplicate_result.duplicate_score > DUPLICATE_REJECT_THRESHOLD:
        reasons.append(
            DecisionReason(
                code="DUPLICATE_IMAGE",
                description=(
                    f"Duplicate image detected (score {duplicate_result.duplicate_score:.2f})"
                ),
                severity="high",
            )
        )

    if fraud_result.fraud_score > FRAUD_REJECT_THRESHOLD:
        reasons.append(
            DecisionReason(
                code="HIGH_FRAUD_SCORE",
                description=f"Fraud score {fraud_result.fraud_score:.2f} exceeds threshold",
                severity="high",
            )
        )

    vision_confidence = vision_result.confidence if vision_result else 0.0

    if (
        not policy_result.covered
        or duplicate_result.duplicate_score > DUPLICATE_REJECT_THRESHOLD
        or fraud_result.fraud_score > FRAUD_REJECT_THRESHOLD
    ):
        decision = "REJECT"
    elif (
        policy_result.covered
        and fraud_result.fraud_score < FRAUD_APPROVE_THRESHOLD
        and vision_confidence > VISION_APPROVE_THRESHOLD
    ):
        decision = "APPROVE"
        reasons.append(
            DecisionReason(
                code="AUTO_APPROVED",
                description="All checks passed with high confidence",
                severity="low",
            )
        )
    else:
        decision = "REVIEW"
        reasons.append(
            DecisionReason(
                code="MANUAL_REVIEW_REQUIRED",
                description="Claim requires human review",
                severity="medium",
            )
        )

    confidence_components = [vision_confidence, fraud_result.fraud_score]
    if ocr_result:
        confidence_components.append(ocr_result.confidence)
    confidence_score = round(
        sum(confidence_components) / len(confidence_components),
        4,
    )

    logger.info(
        "Decision for claim %s: %s (fraud=%.4f, confidence=%.4f)",
        external_claim_id,
        decision,
        fraud_result.fraud_score,
        confidence_score,
    )

    return ClaimDecisionResult(
        claim_id=external_claim_id,
        decision=decision,
        confidence_score=confidence_score,
        fraud_score=fraud_result.fraud_score,
        reasons=reasons,
        vision_result=vision_result.model_dump() if vision_result else {},
        ocr_result=ocr_result.model_dump() if ocr_result else {},
        policy_result={
            "covered": policy_result.covered,
            "rule_fired": policy_result.rule_fired,
            "rules": [rule.model_dump() for rule in policy_result.rules],
        },
        duplicate_detected=duplicate_result.is_duplicate,
        processing_time_ms=processing_time_ms,
        requires_human_review=decision == "REVIEW",
        ai_cost_usd=round(ai_cost_usd, 6),
    )


def decide(
    *,
    external_claim_id: str,
    policy_result: PolicyEvaluationResult,
    duplicate_result: DuplicateAnalysisResult,
    fraud_result: FraudAnalysisResult,
    vision_result: VisionAnalysisResult | None,
    ocr_result: OcrAnalysisResult | None,
    processing_time_ms: int,
) -> "ClaimAnalysisResult":
    """Canonical entrypoint — wraps build_decision()."""
    from app.schemas.results import ClaimAnalysisResult
    from app.services.result_adapters import decision_to_analysis

    legacy = build_decision(
        external_claim_id=external_claim_id,
        policy_result=policy_result,
        duplicate_result=duplicate_result,
        fraud_result=fraud_result,
        vision_result=vision_result,
        ocr_result=ocr_result,
        processing_time_ms=processing_time_ms,
    )
    return decision_to_analysis(legacy)
