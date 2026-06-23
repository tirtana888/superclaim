"""Control Plane policy CRUD endpoints (JWT)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant, get_current_user, require_role
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.policy import PolicyCreate, PolicyListResponse, PolicyOut, PolicyUpdate
from app.services import policy_service

router = APIRouter(prefix="/api/policies", tags=["policies"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.get("", response_model=PolicyListResponse)
async def list_policies(
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyListResponse:
    policies = await policy_service.list_policies(db, tenant.id, status=status_filter)
    items = [policy_service.policy_to_out(p) for p in policies]
    return PolicyListResponse(policies=items, total=len(items))


@router.post("", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
async def create_policy(
    payload: PolicyCreate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyOut:
    policy = await policy_service.create_policy(
        db, tenant_id=tenant.id, created_by=user.id, payload=payload
    )
    return policy_service.policy_to_out(policy)


@router.get("/{policy_id}", response_model=PolicyOut)
async def get_policy(
    policy_id: UUID,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyOut:
    try:
        policy = await policy_service.get_policy(db, tenant.id, policy_id)
    except policy_service.PolicyNotFoundError as exc:
        raise _error("POLICY_NOT_FOUND", "Policy not found", status.HTTP_404_NOT_FOUND) from exc
    return policy_service.policy_to_out(policy)


@router.patch("/{policy_id}", response_model=PolicyOut)
async def update_policy(
    policy_id: UUID,
    payload: PolicyUpdate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyOut:
    try:
        policy = await policy_service.update_policy(
            db, tenant_id=tenant.id, policy_id=policy_id, payload=payload
        )
    except policy_service.PolicyNotFoundError as exc:
        raise _error("POLICY_NOT_FOUND", "Policy not found", status.HTTP_404_NOT_FOUND) from exc
    except policy_service.PolicyStateError as exc:
        raise _error("POLICY_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
    return policy_service.policy_to_out(policy)


@router.post("/{policy_id}/activate", response_model=PolicyOut)
async def activate_policy(
    policy_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyOut:
    try:
        policy = await policy_service.activate_policy(db, tenant_id=tenant.id, policy_id=policy_id)
    except policy_service.PolicyNotFoundError as exc:
        raise _error("POLICY_NOT_FOUND", "Policy not found", status.HTTP_404_NOT_FOUND) from exc
    except policy_service.PolicyStateError as exc:
        raise _error("POLICY_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
    return policy_service.policy_to_out(policy)


@router.post("/{policy_id}/archive", response_model=PolicyOut)
async def archive_policy(
    policy_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyOut:
    try:
        policy = await policy_service.archive_policy(db, tenant_id=tenant.id, policy_id=policy_id)
    except policy_service.PolicyNotFoundError as exc:
        raise _error("POLICY_NOT_FOUND", "Policy not found", status.HTTP_404_NOT_FOUND) from exc
    except policy_service.PolicyStateError as exc:
        raise _error("POLICY_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
    return policy_service.policy_to_out(policy)


@router.post("/{policy_id}/versions", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
async def create_policy_version(
    policy_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PolicyOut:
    try:
        policy = await policy_service.create_policy_version(
            db, tenant_id=tenant.id, created_by=user.id, source_policy_id=policy_id
        )
    except policy_service.PolicyNotFoundError as exc:
        raise _error("POLICY_NOT_FOUND", "Policy not found", status.HTTP_404_NOT_FOUND) from exc
    return policy_service.policy_to_out(policy)


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await policy_service.delete_policy(db, tenant_id=tenant.id, policy_id=policy_id)
    except policy_service.PolicyNotFoundError as exc:
        raise _error("POLICY_NOT_FOUND", "Policy not found", status.HTTP_404_NOT_FOUND) from exc
    except policy_service.PolicyStateError as exc:
        raise _error("POLICY_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
