from typing import Any

from pydantic import BaseModel, Field


class OcrAnalysisResult(BaseModel):
    serial_numbers_found: list[str] = Field(default_factory=list)
    best_match: str | None = None
    match_with_input: bool | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    ai_cost_usd: float = Field(ge=0.0)
    raw_response: dict[str, Any] = Field(default_factory=dict)
