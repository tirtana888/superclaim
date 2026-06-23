"""Control Plane authentication endpoints (JWT)."""

from __future__ import annotations

import re
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_tenant,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    SignupRequest,
    TenantOut,
    TokenResponse,
    UserOut,
)
from app.schemas.team import AcceptInviteRequest
from app.services import team_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "tenant"


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug = _slugify(base)
    existing = await db.execute(select(Tenant.id).where(Tenant.slug == slug))
    if existing.scalar_one_or_none() is None:
        return slug
    return f"{slug}-{secrets.token_hex(3)}"


def _tokens_for(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(
            user_id=user.id, tenant_id=user.tenant_id, role=user.role
        ),
        refresh_token=create_refresh_token(
            user_id=user.id, tenant_id=user.tenant_id, role=user.role
        ),
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    slug = payload.slug.strip() if payload.slug else None
    slug = await _unique_slug(db, slug or payload.tenant_name)

    tenant = Tenant(
        name=payload.tenant_name.strip(),
        slug=slug,
        status="active",
        plan_tier="trial",
        api_key_hash=secrets.token_hex(32),
        is_active=True,
    )
    db.add(tenant)
    await db.flush()

    user = User(
        tenant_id=tenant.id,
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
        role="owner",
        status="active",
    )
    db.add(user)
    await db.commit()
    await db.refresh(tenant)
    await db.refresh(user)

    return AuthResponse(
        user=UserOut.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
        tokens=_tokens_for(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = str(payload.email).lower()
    stmt = select(User).where(User.email == email, User.status == "active")
    if payload.tenant_slug:
        stmt = stmt.join(Tenant, Tenant.id == User.tenant_id).where(
            Tenant.slug == payload.tenant_slug.strip()
        )

    result = await db.execute(stmt)
    users = result.scalars().all()

    if len(users) > 1:
        raise _error(
            "AMBIGUOUS_LOGIN",
            "Email exists in multiple workspaces; provide tenant_slug.",
            status.HTTP_400_BAD_REQUEST,
        )

    user = users[0] if users else None
    if user is None or not verify_password(payload.password, user.password_hash):
        raise _error("INVALID_CREDENTIALS", "Invalid email or password", status.HTTP_401_UNAUTHORIZED)

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == user.tenant_id, Tenant.is_active.is_(True))
    )
    tenant = tenant_result.scalar_one_or_none()
    if tenant is None:
        raise _error("TENANT_INACTIVE", "Workspace is inactive", status.HTTP_403_FORBIDDEN)

    return AuthResponse(
        user=UserOut.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
        tokens=_tokens_for(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    claims = decode_token(payload.refresh_token, expected_type="refresh")
    from uuid import UUID

    try:
        user_id = UUID(claims["sub"])
        tenant_id = UUID(claims["tid"])
    except (KeyError, ValueError) as exc:
        raise _error("INVALID_TOKEN", "Malformed token claims", status.HTTP_401_UNAUTHORIZED) from exc

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.tenant_id == tenant_id,
            User.status == "active",
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise _error("USER_NOT_FOUND", "User no longer exists or is inactive", status.HTTP_401_UNAUTHORIZED)

    return _tokens_for(user)


@router.get("/me", response_model=MeResponse)
async def me(
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
) -> MeResponse:
    return MeResponse(
        user=UserOut.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
    )


@router.post("/accept-invite", response_model=AuthResponse)
async def accept_invite(
    payload: AcceptInviteRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    try:
        user = await team_service.accept_invite(
            db,
            email=str(payload.email),
            tenant_slug=payload.tenant_slug,
            temporary_password=payload.temporary_password,
            new_password=payload.new_password,
        )
    except team_service.TeamStateError as exc:
        raise _error("INVALID_INVITE", str(exc), status.HTTP_400_BAD_REQUEST) from exc

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if tenant is None:
        raise _error("TENANT_NOT_FOUND", "Workspace not found", status.HTTP_404_NOT_FOUND)

    return AuthResponse(
        user=UserOut.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
        tokens=_tokens_for(user),
    )
