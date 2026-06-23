"""Canonical cross-service result contract for SuperClaim.ai.

This module is the SINGLE SOURCE OF TRUTH for the shapes every analysis service
produces and the decision service consumes. Do NOT duplicate these models
elsewhere. If a field must change, change it here and update every consumer in
the same session (see .cursorrules -> COMPATIBILITY & VALIDATION RULES).

All field names are snake_case (DB, Python, JSON). The Next.js dashboard maps to
camelCase only at its own boundary if needed.
"""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Sub-results produced by each service
# ---------------------------------------------------------------------------


class VisionResult(BaseModel):
    """Output of vision_service.analyze()."""

    damage_type: str
    damage_severity: Literal["none", "minor", "moderate", "severe"]
    device_identified: Optional[str] = None
    confidence: float = Field(ge=0, le=1)
    ai_cost_usd: float = 0.0


class OCRResult(BaseModel):
    """Output of ocr_service.extract()."""

    serial_numbers_found: list[str] = Field(default_factory=list)
    best_match: Optional[str] = None
    matches_input: bool = False
    confidence: float = Field(ge=0, le=1)
    ai_cost_usd: float = 0.0


class DuplicateResult(BaseModel):
    """Output of duplicate_service.check()."""

    is_duplicate: bool = False
    similar_claim_ids: list[str] = Field(default_factory=list)
    max_similarity: float = 0.0
    exif_flags: list[str] = Field(default_factory=list)


class RuleOutcome(BaseModel):
    """A single deterministic policy rule result."""

    rule_id: str
    passed: bool
    reason: str


class PolicyResult(BaseModel):
    """Output of policy_engine.evaluate()."""

    covered: bool
    rules: list[RuleOutcome] = Field(default_factory=list)
    policy_version: int


class FraudResult(BaseModel):
    """Output of fraud_service.score()."""

    fraud_score: float = Field(ge=0, le=1)
    risk_level: Literal["low", "medium", "high"]
    feature_contributions: dict[str, float] = Field(default_factory=dict)


class ReasonItem(BaseModel):
    """A human-readable reason contributing to the final decision."""

    code: str
    description: str
    severity: Literal["low", "medium", "high"]


# ---------------------------------------------------------------------------
# Canonical inputs shared by the engine (extend with OPTIONAL fields only)
# ---------------------------------------------------------------------------


class ClaimInput(BaseModel):
    """Normalized claim payload passed into the deterministic policy engine."""

    external_claim_id: str
    device_category: str
    serial_number_input: Optional[str] = None
    purchase_date: Optional[date] = None
    claim_date: Optional[date] = None
    damage_description: Optional[str] = None
    damage_type: Optional[str] = None
    policy_id: Optional[str] = None


class ClaimFeatures(BaseModel):
    """Feature vector consumed by fraud_service.score()."""

    days_since_purchase: float = 0.0
    user_claim_count_30d: int = 0
    user_claim_count_90d: int = 0
    user_claim_count_all: int = 0
    serial_claim_count: int = 0
    damage_desc_length: int = 0
    has_exif: bool = False
    exif_date_matches_claim: bool = False
    duplicate_score: float = 0.0
    vision_confidence: float = 0.0
    ocr_match: bool = False


# ---------------------------------------------------------------------------
# Final aggregate result (decision_service fills this completely)
# ---------------------------------------------------------------------------


class ClaimAnalysisResult(BaseModel):
    """Canonical end-to-end analysis result.

    decision_service.decide() returns this; the Data Plane response and the
    brand dashboard both read this shape.
    """

    claim_id: str
    decision: Literal["APPROVE", "REJECT", "REVIEW"]
    confidence_score: float = Field(ge=0, le=1)
    fraud_score: float = Field(ge=0, le=1)
    requires_human_review: bool
    reasons: list[ReasonItem] = Field(default_factory=list)
    vision_result: Optional[VisionResult] = None
    ocr_result: Optional[OCRResult] = None
    policy_result: Optional[PolicyResult] = None
    duplicate_result: Optional[DuplicateResult] = None
    ai_cost_usd: float = 0.0
    processing_time_ms: int = 0
