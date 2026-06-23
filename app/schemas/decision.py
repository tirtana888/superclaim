from typing import Any, Literal

from pydantic import BaseModel, Field


class DecisionReason(BaseModel):
    code: str
    description: str
    severity: Literal["low", "medium", "high"]


class ClaimDecisionResult(BaseModel):
    claim_id: str
    decision: Literal["APPROVE", "REJECT", "REVIEW"]
    confidence_score: float = Field(ge=0.0, le=1.0)
    fraud_score: float = Field(ge=0.0, le=1.0)
    reasons: list[DecisionReason] = Field(default_factory=list)
    vision_result: dict[str, Any] = Field(default_factory=dict)
    ocr_result: dict[str, Any] = Field(default_factory=dict)
    policy_result: dict[str, Any] = Field(default_factory=dict)
    duplicate_detected: bool = False
    processing_time_ms: int = 0
    requires_human_review: bool = False
    ai_cost_usd: float = Field(default=0.0, ge=0.0)
