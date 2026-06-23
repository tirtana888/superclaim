"""Platform admin (superadmin) schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PlatformAdminOut(BaseModel):
    id: UUID
    email: str
    status: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TenantAdminOut(BaseModel):
    id: UUID
    name: str
    slug: str | None = None
    status: str
    plan_tier: str
    is_active: bool
    user_count: int = 0
    claim_count: int = 0
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TenantAdminDetail(TenantAdminOut):
    pass


class TenantAdminUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=50)
    plan_tier: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None


class TenantUserAdminOut(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    role: str
    status: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class PlatformStatsOut(BaseModel):
    tenant_count: int
    active_tenant_count: int
    user_count: int
    claim_count: int
