"""Control Plane API credential management — tenant-scoped."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import tenant_query
from app.core.security import generate_api_secret, generate_key_id, hash_secret
from app.models.api_credential import ApiCredential
from app.schemas.control import ApiCredentialCreate, ApiCredentialCreated, ApiCredentialOut


class CredentialNotFoundError(Exception):
    pass


class CredentialStateError(Exception):
    pass


def credential_to_out(credential: ApiCredential) -> ApiCredentialOut:
    return ApiCredentialOut.model_validate(credential)


async def list_credentials(
    db: AsyncSession,
    tenant_id: UUID,
    *,
    status: str | None = None,
) -> list[ApiCredential]:
    stmt = tenant_query(ApiCredential, tenant_id).order_by(ApiCredential.created_at.desc())
    if status is not None:
        stmt = stmt.where(ApiCredential.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_credential(
    db: AsyncSession, tenant_id: UUID, credential_id: UUID
) -> ApiCredential:
    result = await db.execute(
        tenant_query(ApiCredential, tenant_id).where(ApiCredential.id == credential_id)
    )
    credential = result.scalar_one_or_none()
    if credential is None:
        raise CredentialNotFoundError(str(credential_id))
    return credential


async def create_credential(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    payload: ApiCredentialCreate,
) -> ApiCredentialCreated:
    secret = generate_api_secret()
    credential = ApiCredential(
        tenant_id=tenant_id,
        key_id=generate_key_id(),
        secret_hash=hash_secret(secret),
        label=payload.label,
        scopes=list(payload.scopes),
        status="active",
        expires_at=payload.expires_at,
    )
    db.add(credential)
    await db.flush()
    await db.commit()
    await db.refresh(credential)
    base = credential_to_out(credential)
    return ApiCredentialCreated(**base.model_dump(), secret=secret)


async def revoke_credential(
    db: AsyncSession, *, tenant_id: UUID, credential_id: UUID
) -> ApiCredential:
    credential = await get_credential(db, tenant_id, credential_id)
    if credential.status == "revoked":
        raise CredentialStateError("Credential is already revoked")
    credential.status = "revoked"
    await db.commit()
    await db.refresh(credential)
    return credential


async def rotate_credential(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    credential_id: UUID,
) -> ApiCredentialCreated:
    """Revoke the old credential and issue a new key with the same label/scopes."""
    old = await get_credential(db, tenant_id, credential_id)
    if old.status == "revoked":
        raise CredentialStateError("Cannot rotate a revoked credential")

    old.status = "revoked"
    secret = generate_api_secret()
    new_cred = ApiCredential(
        tenant_id=tenant_id,
        key_id=generate_key_id(),
        secret_hash=hash_secret(secret),
        label=old.label,
        scopes=list(old.scopes),
        status="active",
        expires_at=old.expires_at,
    )
    db.add(new_cred)
    await db.flush()
    await db.commit()
    await db.refresh(new_cred)
    base = credential_to_out(new_cred)
    return ApiCredentialCreated(**base.model_dump(), secret=secret)
