"""Control Plane auth schemas (Pydantic v2)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    tenant_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    slug: str | None = Field(default=None, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    tenant_slug: str | None = Field(
        default=None,
        max_length=255,
        description="Required only when the same email exists in multiple tenants.",
    )


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


class UserOut(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    role: str
    status: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class TenantOut(BaseModel):
    id: UUID
    name: str
    slug: str | None = None
    status: str
    plan_tier: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserOut
    tenant: TenantOut
    tokens: TokenResponse


class MeResponse(BaseModel):
    user: UserOut
    tenant: TenantOut
