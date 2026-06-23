from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ExifFlag(BaseModel):
    code: str
    description: str
    severity: Literal["low", "medium", "high"]


class DuplicateAnalysisResult(BaseModel):
    is_duplicate: bool
    similar_claim_ids: list[str] = Field(default_factory=list)
    exif_flags: list[ExifFlag] = Field(default_factory=list)
    duplicate_score: float = Field(default=0.0, ge=0.0, le=1.0)
    exif_data: dict[str, Any] = Field(default_factory=dict)
