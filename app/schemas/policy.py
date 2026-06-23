from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

PolicyStatus = Literal["draft", "active", "archived"]


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


# ---- Control Plane CRUD ----


class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    external_policy_id: str | None = Field(default=None, max_length=255)
    rules_json: PolicyConfig
    effective_from: datetime | None = None


class PolicyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    rules_json: PolicyConfig | None = None
    effective_from: datetime | None = None


class PolicyOut(BaseModel):
    id: UUID
    tenant_id: UUID
    external_policy_id: str
    name: str
    version: int
    status: str
    is_active: bool
    rules_json: dict[str, Any]
    effective_from: datetime | None = None
    created_by: UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PolicyListResponse(BaseModel):
    policies: list[PolicyOut]
    total: int

