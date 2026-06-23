from typing import Any, Literal

from pydantic import BaseModel, Field


class VisionAnalysisResult(BaseModel):
    damage_type: str
    damage_severity: Literal["none", "minor", "moderate", "severe"]
    device_identified: str
    confidence: float = Field(ge=0.0, le=1.0)
    ai_cost_usd: float = Field(ge=0.0)
    raw_response: dict[str, Any] = Field(default_factory=dict)
