from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PolicyConfig(BaseModel):
    warranty_months: int = Field(default=12, ge=1)
    covered_device_categories: list[str] = Field(default_factory=list)
    covered_damage_types: list[str] = Field(default_factory=list)
    max_claims_per_serial: int = Field(default=2, ge=1)
    cooling_period_days: int = Field(default=30, ge=0)


class RuleResult(BaseModel):
    rule_id: str
    passed: bool
    reason: str


class PolicyEvaluationResult(BaseModel):
    covered: bool
    rule_fired: str | None = None
    rules: list[RuleResult] = Field(default_factory=list)
    policy_id: str | None = None
    policy_version: int | None = None
    config: dict[str, Any] = Field(default_factory=dict)
