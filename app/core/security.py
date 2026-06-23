"""Core security: password hashing, JWT, and the FIXED auth dependencies.

Dependency names are locked by .cursorrules and must never be renamed:
  - get_current_user        -> JWT user (Control Plane)
  - get_current_tenant      -> tenant from JWT user
  - get_tenant_from_apikey  -> tenant from API key id + secret (Data Plane)
  - require_role(*roles)    -> role guard
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.api_credential import ApiCredential
from app.models.tenant import Tenant
from app.models.user import User

_password_hasher = PasswordHasher()

TokenType = Literal["access", "refresh"]


# ---------------------------------------------------------------------------
# Password hashing (Argon2)
# ---------------------------------------------------------------------------


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


# ---------------------------------------------------------------------------
# API secret hashing (Argon2) + key id generation
# ---------------------------------------------------------------------------


def generate_key_id() -> str:
    return "sck_" + secrets.token_hex(12)


def generate_api_secret() -> str:
    return "scs_" + secrets.token_urlsafe(32)


def hash_secret(secret: str) -> str:
    return _password_hasher.hash(secret)


def verify_secret(secret: str, secret_hash: str) -> bool:
    try:
        return _password_hasher.verify(secret_hash, secret)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------


def _create_token(
    *, user_id: UUID, tenant_id: UUID, role: str, token_type: TokenType, expires_delta: timedelta
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "tid": str(tenant_id),
        "role": role,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(*, user_id: UUID, tenant_id: UUID, role: str) -> str:
    return _create_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(*, user_id: UUID, tenant_id: UUID, role: str) -> str:
    return _create_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, *, expected_type: TokenType) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise _auth_error("TOKEN_EXPIRED", "Token has expired") from exc
    except jwt.PyJWTError as exc:
        raise _auth_error("INVALID_TOKEN", "Could not validate token") from exc

    if payload.get("type") != expected_type:
        raise _auth_error("INVALID_TOKEN", f"Expected {expected_type} token")
    return payload


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


def _auth_error(error_code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error_code": error_code, "message": message, "detail": None},
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"error_code": "FORBIDDEN", "message": message, "detail": None},
    )


# ---------------------------------------------------------------------------
# Control Plane dependencies (JWT)
# ---------------------------------------------------------------------------


async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> User:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _auth_error("INVALID_AUTH_HEADER", "Authorization must be a Bearer token")

    payload = decode_token(token, expected_type="access")
    try:
        user_id = UUID(payload["sub"])
        tenant_id = UUID(payload["tid"])
    except (KeyError, ValueError) as exc:
        raise _auth_error("INVALID_TOKEN", "Malformed token claims") from exc

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.tenant_id == tenant_id,
            User.status == "active",
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise _auth_error("USER_NOT_FOUND", "User no longer exists or is inactive")
    return user


async def get_current_tenant(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    result = await db.execute(
        select(Tenant).where(Tenant.id == user.tenant_id, Tenant.is_active.is_(True))
    )
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise _auth_error("TENANT_NOT_FOUND", "Tenant no longer exists or is inactive")
    return tenant


def require_role(*roles: str):
    """Dependency factory: allow only users whose role is in ``roles``."""

    async def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise _forbidden(f"Requires role: {', '.join(roles)}")
        return user

    return _guard


# ---------------------------------------------------------------------------
# Data Plane dependency (API key id + secret) -> tenant
# ---------------------------------------------------------------------------


async def get_tenant_from_apikey(
    key_id: str = Header(..., alias=settings.api_key_id_header),
    secret: str = Header(..., alias=settings.api_secret_header),
    db: AsyncSession = Depends(get_db),
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
    await db.commit()
    return tenant
