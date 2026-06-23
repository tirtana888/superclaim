"""Control Plane schemas for devices, claim events, and usage."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

DeviceSource = Literal["manual", "import", "api"]


class DeviceCreate(BaseModel):
    serial_number: str = Field(..., min_length=1, max_length=255)
    device_category: str = Field(..., min_length=1, max_length=100)
    device_model: str | None = Field(default=None, max_length=255)
    purchase_date: date | None = None
    warranty_months: int | None = Field(default=None, ge=1, le=120)
    customer_ref: str | None = Field(default=None, max_length=255)
    batch_id: str | None = Field(default=None, max_length=255)
    source: DeviceSource = "manual"


class DeviceOut(BaseModel):
    id: UUID
    tenant_id: UUID
    serial_number: str
    device_category: str
    device_model: str | None = None
    purchase_date: date | None = None
    warranty_months: int | None = None
    customer_ref: str | None = None
    batch_id: str | None = None
    source: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class DeviceUpdate(BaseModel):
    device_category: str | None = Field(default=None, min_length=1, max_length=100)
    device_model: str | None = Field(default=None, max_length=255)
    purchase_date: date | None = None
    warranty_months: int | None = Field(default=None, ge=1, le=120)
    customer_ref: str | None = Field(default=None, max_length=255)
    batch_id: str | None = Field(default=None, max_length=255)
    source: DeviceSource | None = None


class DeviceListResponse(BaseModel):
    devices: list[DeviceOut]
    total: int


class DeviceBulkCreate(BaseModel):
    devices: list[DeviceCreate] = Field(..., min_length=1, max_length=500)


class DeviceBulkCreateResponse(BaseModel):
    created: list[DeviceOut]
    total: int


class ClaimEventOut(BaseModel):
    id: UUID
    tenant_id: UUID
    claim_id: UUID
    event_type: str
    actor: str
    detail_json: dict = Field(default_factory=dict)
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UsageRecordOut(BaseModel):
    id: UUID
    tenant_id: UUID
    period: str
    claims_processed: int
    ai_cost_total: float
    billable_amount: float
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ---- API credentials (Data Plane keys) ----

DEFAULT_API_SCOPES = ["claims:analyze"]


class ApiCredentialCreate(BaseModel):
    label: str | None = Field(default=None, max_length=255)
    scopes: list[str] = Field(default_factory=lambda: list(DEFAULT_API_SCOPES))
    expires_at: datetime | None = None


class ApiCredentialOut(BaseModel):
    id: UUID
    tenant_id: UUID
    key_id: str
    label: str | None = None
    scopes: list[str]
    status: str
    last_used_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ApiCredentialCreated(ApiCredentialOut):
    """Returned only once at creation — includes the plaintext secret."""

    secret: str


class ApiCredentialListResponse(BaseModel):
    credentials: list[ApiCredentialOut]
    total: int
