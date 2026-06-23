import hashlib
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
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


async def get_api_credentials(
    x_api_key: str = Header(..., alias=settings.api_key_header),
    x_tenant_id: str = Header(..., alias=settings.tenant_id_header),
) -> tuple[str, str]:
    return x_api_key, x_tenant_id


async def get_authenticated_context(
    credentials: tuple[str, str] = Depends(get_api_credentials),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedContext:
    x_api_key, x_tenant_id = credentials
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
