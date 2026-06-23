"""Control Plane team management schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import UserOut

TeamRole = Literal["owner", "admin", "reviewer"]
InvitableRole = Literal["admin", "reviewer"]
MemberStatus = Literal["active", "invited", "disabled"]


class TeamInviteRequest(BaseModel):
    email: EmailStr
    role: InvitableRole = "reviewer"


class TeamInviteCreated(UserOut):
    """Returned once at invite — includes temporary password for first login."""

    temporary_password: str


class TeamMemberUpdate(BaseModel):
    role: TeamRole | None = None
    status: MemberStatus | None = None


class TeamListResponse(BaseModel):
    members: list[UserOut]
    total: int


class AcceptInviteRequest(BaseModel):
    email: EmailStr
    tenant_slug: str = Field(..., min_length=1, max_length=255)
    temporary_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
