"""Control Plane API credential endpoints (JWT)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant, get_current_user, require_role
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.control import (
    ApiCredentialCreate,
    ApiCredentialCreated,
    ApiCredentialListResponse,
    ApiCredentialOut,
)
from app.services import credential_service

router = APIRouter(prefix="/api/credentials", tags=["credentials"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.get("", response_model=ApiCredentialListResponse)
async def list_credentials(
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ApiCredentialListResponse:
    credentials = await credential_service.list_credentials(
        db, tenant.id, status=status_filter
    )
    items = [credential_service.credential_to_out(c) for c in credentials]
    return ApiCredentialListResponse(credentials=items, total=len(items))


@router.post("", response_model=ApiCredentialCreated, status_code=status.HTTP_201_CREATED)
async def create_credential(
    payload: ApiCredentialCreate,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ApiCredentialCreated:
    return await credential_service.create_credential(
        db, tenant_id=tenant.id, payload=payload
    )


@router.get("/{credential_id}", response_model=ApiCredentialOut)
async def get_credential(
    credential_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ApiCredentialOut:
    try:
        credential = await credential_service.get_credential(
            db, tenant.id, credential_id
        )
    except credential_service.CredentialNotFoundError as exc:
        raise _error(
            "CREDENTIAL_NOT_FOUND", "API credential not found", status.HTTP_404_NOT_FOUND
        ) from exc
    return credential_service.credential_to_out(credential)


@router.post("/{credential_id}/revoke", response_model=ApiCredentialOut)
async def revoke_credential(
    credential_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ApiCredentialOut:
    try:
        credential = await credential_service.revoke_credential(
            db, tenant_id=tenant.id, credential_id=credential_id
        )
    except credential_service.CredentialNotFoundError as exc:
        raise _error(
            "CREDENTIAL_NOT_FOUND", "API credential not found", status.HTTP_404_NOT_FOUND
        ) from exc
    except credential_service.CredentialStateError as exc:
        raise _error("CREDENTIAL_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
    return credential_service.credential_to_out(credential)


@router.post(
    "/{credential_id}/rotate",
    response_model=ApiCredentialCreated,
    status_code=status.HTTP_201_CREATED,
)
async def rotate_credential(
    credential_id: UUID,
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ApiCredentialCreated:
    try:
        return await credential_service.rotate_credential(
            db, tenant_id=tenant.id, credential_id=credential_id
        )
    except credential_service.CredentialNotFoundError as exc:
        raise _error(
            "CREDENTIAL_NOT_FOUND", "API credential not found", status.HTTP_404_NOT_FOUND
        ) from exc
    except credential_service.CredentialStateError as exc:
        raise _error("CREDENTIAL_STATE", str(exc), status.HTTP_409_CONFLICT) from exc
