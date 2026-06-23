from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ClaimImageInput(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_base64: str = Field(..., min_length=1)
    content_type: str = Field(default="image/jpeg", max_length=100)

    @field_validator("filename")
    @classmethod
    def sanitize_filename(cls, value: str) -> str:
        clean = value.replace("\\", "/").split("/")[-1].strip()
        if not clean or clean in {".", ".."}:
            raise ValueError("Invalid filename")
        return clean


class ClaimAnalyzeRequest(BaseModel):
    claim_id: str = Field(..., min_length=1, max_length=255)
    device_category: str = Field(..., min_length=1, max_length=100)
    serial_number_input: str | None = Field(default=None, max_length=255)
    purchase_date: date | None = None
    claim_date: date | None = None
    damage_description: str | None = None
    images: list[ClaimImageInput] = Field(..., min_length=1)
    policy_id: str | None = Field(default=None, max_length=255)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ClaimAnalyzeResponse(BaseModel):
    claim_id: str
    internal_id: UUID
    status: str
    image_count: int
    submitted_at: datetime


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    detail: Any | None = None
