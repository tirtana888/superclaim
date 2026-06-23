"""Control Plane team management endpoints (JWT)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant, get_current_user, require_role
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.team import TeamInviteCreated, TeamInviteRequest, TeamListResponse, TeamMemberUpdate
from app.services import team_service

router = APIRouter(prefix="/api/team", tags=["team"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.get("", response_model=TeamListResponse)
async def list_team(
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TeamListResponse:
    members = await team_service.list_members(db, tenant.id)
    items = [team_service.user_to_out(m) for m in members]
    return TeamListResponse(members=items, total=len(items))


@router.post("/invite", response_model=TeamInviteCreated, status_code=status.HTTP_201_CREATED)
async def invite_member(
    payload: TeamInviteRequest,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TeamInviteCreated:
    try:
        return await team_service.invite_member(
            db, tenant_id=tenant.id, inviter=user, payload=payload
        )
    except team_service.TeamConflictError as exc:
        raise _error("TEAM_CONFLICT", str(exc), status.HTTP_409_CONFLICT) from exc
    except team_service.TeamStateError as exc:
        raise _error("TEAM_STATE", str(exc), status.HTTP_403_FORBIDDEN) from exc


@router.get("/{user_id}", response_model=UserOut)
async def get_member(
    user_id: UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    try:
        member = await team_service.get_member(db, tenant.id, user_id)
    except team_service.TeamMemberNotFoundError as exc:
        raise _error("MEMBER_NOT_FOUND", "Team member not found", status.HTTP_404_NOT_FOUND) from exc
    return team_service.user_to_out(member)


@router.patch("/{user_id}", response_model=UserOut)
async def update_member(
    user_id: UUID,
    payload: TeamMemberUpdate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    try:
        member = await team_service.update_member(
            db, tenant_id=tenant.id, actor=user, user_id=user_id, payload=payload
        )
    except team_service.TeamMemberNotFoundError as exc:
        raise _error("MEMBER_NOT_FOUND", "Team member not found", status.HTTP_404_NOT_FOUND) from exc
    except team_service.TeamStateError as exc:
        raise _error("TEAM_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
    return team_service.user_to_out(member)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    user_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await team_service.remove_member(
            db, tenant_id=tenant.id, actor=user, user_id=user_id
        )
    except team_service.TeamMemberNotFoundError as exc:
        raise _error("MEMBER_NOT_FOUND", "Team member not found", status.HTTP_404_NOT_FOUND) from exc
    except team_service.TeamStateError as exc:
        raise _error("TEAM_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
