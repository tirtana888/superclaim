"""Control Plane team management — tenant-scoped."""

from __future__ import annotations

import secrets
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import tenant_query
from app.core.security import hash_password, verify_password
from app.models.user import USER_ROLES, User
from app.schemas.auth import UserOut
from app.schemas.team import TeamInviteRequest, TeamInviteCreated, TeamMemberUpdate


class TeamMemberNotFoundError(Exception):
    pass


class TeamConflictError(Exception):
    pass


class TeamStateError(Exception):
    pass


def user_to_out(user: User) -> UserOut:
    return UserOut.model_validate(user)


async def list_members(db: AsyncSession, tenant_id: UUID) -> list[User]:
    result = await db.execute(
        tenant_query(User, tenant_id).order_by(User.created_at.asc())
    )
    return list(result.scalars().all())


async def get_member(db: AsyncSession, tenant_id: UUID, user_id: UUID) -> User:
    result = await db.execute(
        tenant_query(User, tenant_id).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise TeamMemberNotFoundError(str(user_id))
    return user


async def _count_owners(db: AsyncSession, tenant_id: UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(User)
        .where(
            User.tenant_id == tenant_id,
            User.role == "owner",
            User.status == "active",
        )
    )
    return int(result.scalar_one())


async def invite_member(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    inviter: User,
    payload: TeamInviteRequest,
) -> TeamInviteCreated:
    if inviter.role == "admin" and payload.role == "owner":
        raise TeamStateError("Admins cannot invite owners")

    temp_password = secrets.token_urlsafe(12)
    user = User(
        tenant_id=tenant_id,
        email=str(payload.email).lower(),
        password_hash=hash_password(temp_password),
        role=payload.role,
        status="invited",
    )
    db.add(user)
    try:
        await db.flush()
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise TeamConflictError("A user with this email already exists in the workspace") from exc
    await db.refresh(user)
    base = user_to_out(user)
    return TeamInviteCreated(**base.model_dump(), temporary_password=temp_password)


async def update_member(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    actor: User,
    user_id: UUID,
    payload: TeamMemberUpdate,
) -> User:
    member = await get_member(db, tenant_id, user_id)
    data = payload.model_dump(exclude_unset=True)

    if "role" in data:
        new_role = data["role"]
        if new_role not in USER_ROLES:
            raise TeamStateError(f"Invalid role: {new_role}")
        if actor.role == "admin" and new_role == "owner":
            raise TeamStateError("Admins cannot assign the owner role")
        if member.role == "owner" and new_role != "owner":
            owners = await _count_owners(db, tenant_id)
            if owners <= 1:
                raise TeamStateError("Cannot change role of the last active owner")
        member.role = new_role

    if "status" in data:
        new_status = data["status"]
        if member.id == actor.id and new_status != "active":
            raise TeamStateError("You cannot disable your own account")
        if member.role == "owner" and new_status != "active":
            owners = await _count_owners(db, tenant_id)
            if owners <= 1:
                raise TeamStateError("Cannot disable the last active owner")
        member.status = new_status

    await db.commit()
    await db.refresh(member)
    return member


async def remove_member(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    actor: User,
    user_id: UUID,
) -> None:
    if actor.id == user_id:
        raise TeamStateError("You cannot remove your own account")

    member = await get_member(db, tenant_id, user_id)
    if member.role == "owner":
        owners = await _count_owners(db, tenant_id)
        if owners <= 1:
            raise TeamStateError("Cannot remove the last active owner")

    await db.delete(member)
    await db.commit()


async def accept_invite(
    db: AsyncSession,
    *,
    email: str,
    tenant_slug: str,
    temporary_password: str,
    new_password: str,
) -> User:
    from app.models.tenant import Tenant

    result = await db.execute(
        select(User)
        .join(Tenant, Tenant.id == User.tenant_id)
        .where(
            User.email == email.lower(),
            User.status == "invited",
            Tenant.slug == tenant_slug.strip(),
        )
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(temporary_password, user.password_hash):
        raise TeamStateError("Invalid invite credentials")

    user.password_hash = hash_password(new_password)
    user.status = "active"
    await db.commit()
    await db.refresh(user)
    return user
