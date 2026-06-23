"""Unified Data Plane authentication — legacy API key + canonical key id/secret."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import verify_secret
from app.database import get_db
from app.models.api_credential import ApiCredential
from app.models.tenant import Tenant


def hash_api_key(api_key: str) -> str:
    """Hash API key with app secret for storage and lookup."""
    payload = f"{api_key}{settings.secret_key}".encode()
    return hashlib.sha256(payload).hexdigest()


@dataclass(frozen=True)
class TenantContext:
    tenant_id: UUID
    tenant: Tenant


@dataclass(frozen=True)
class AuthenticatedContext:
    tenant: TenantContext
    db: AsyncSession


def _auth_error(error_code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error_code": error_code, "message": message, "detail": None},
    )


async def _resolve_tenant_from_credential(
    db: AsyncSession, key_id: str, secret: str
) -> Tenant:
    result = await db.execute(
        select(ApiCredential).where(
            ApiCredential.key_id == key_id,
            ApiCredential.status == "active",
        )
    )
    credential = result.scalar_one_or_none()
    if credential is None or not verify_secret(secret, credential.secret_hash):
        raise _auth_error("INVALID_API_CREDENTIAL", "Invalid API key id or secret")

    if credential.expires_at is not None and credential.expires_at < datetime.now(UTC):
        raise _auth_error("API_CREDENTIAL_EXPIRED", "API credential has expired")

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == credential.tenant_id, Tenant.is_active.is_(True))
    )
    tenant = tenant_result.scalar_one_or_none()
    if tenant is None:
        raise _auth_error("TENANT_NOT_FOUND", "Tenant for credential is inactive")

    credential.last_used_at = datetime.now(UTC)
    await db.flush()
    return tenant


async def get_authenticated_context(
    db: AsyncSession = Depends(get_db),
    x_api_key: str | None = Header(default=None, alias=settings.api_key_header),
    x_tenant_id: str | None = Header(default=None, alias=settings.tenant_id_header),
    x_api_key_id: str | None = Header(default=None, alias=settings.api_key_id_header),
    x_api_secret: str | None = Header(default=None, alias=settings.api_secret_header),
) -> AuthenticatedContext:
    """Resolve tenant from canonical credentials (preferred) or legacy headers."""
    if x_api_key_id and x_api_secret:
        tenant = await _resolve_tenant_from_credential(db, x_api_key_id, x_api_secret)
        tenant_ctx = TenantContext(tenant_id=tenant.id, tenant=tenant)
        return AuthenticatedContext(tenant=tenant_ctx, db=db)

    if x_api_key and x_tenant_id:
        try:
            tenant_uuid = UUID(x_tenant_id)
        except ValueError as exc:
            raise _auth_error("INVALID_TENANT_ID", "Invalid tenant ID format") from exc

        key_hash = hash_api_key(x_api_key)
        result = await db.execute(
            select(Tenant).where(
                Tenant.id == tenant_uuid,
                Tenant.api_key_hash == key_hash,
                Tenant.is_active.is_(True),
            )
        )
        tenant = result.scalar_one_or_none()
        if tenant is None:
            raise _auth_error("AUTH_FAILED", "Invalid API key or tenant")
        tenant_ctx = TenantContext(tenant_id=tenant_uuid, tenant=tenant)
        return AuthenticatedContext(tenant=tenant_ctx, db=db)

    raise _auth_error(
        "MISSING_CREDENTIALS",
        "Provide X-API-Key-Id + X-API-Secret or legacy X-API-Key + X-Tenant-ID",
    )
