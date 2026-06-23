"""Unit tests for team_service."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas.team import TeamInviteRequest, TeamMemberUpdate
from app.services import team_service


def _user(**kwargs) -> User:
    defaults = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "email": "u@test.io",
        "password_hash": "hash",
        "role": "owner",
        "status": "active",
    }
    defaults.update(kwargs)
    return User(**defaults)


@pytest.mark.asyncio
async def test_invite_member_returns_temp_password() -> None:
    tenant_id = uuid4()
    inviter = _user(tenant_id=tenant_id, role="owner")
    session = AsyncMock()
    added: list[User] = []

    def _add(obj: User) -> None:
        obj.id = uuid4()
        added.append(obj)

    session.add = MagicMock(side_effect=_add)
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    with patch("app.services.team_service.secrets.token_urlsafe", return_value="temp-pass-123"):
        result = await team_service.invite_member(
            session,
            tenant_id=tenant_id,
            inviter=inviter,
            payload=TeamInviteRequest(email="new@test.io", role="reviewer"),
        )

    assert result.temporary_password == "temp-pass-123"
    assert result.status == "invited"
    assert result.role == "reviewer"
    assert added[0].email == "new@test.io"


@pytest.mark.asyncio
async def test_invite_duplicate_email_raises_conflict() -> None:
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock(side_effect=IntegrityError("insert", {}, Exception()))
    session.rollback = AsyncMock()
    inviter = _user(role="owner")

    with pytest.raises(team_service.TeamConflictError):
        await team_service.invite_member(
            session,
            tenant_id=inviter.tenant_id,
            inviter=inviter,
            payload=TeamInviteRequest(email="dup@test.io", role="admin"),
        )


@pytest.mark.asyncio
async def test_remove_self_raises() -> None:
    actor = _user()
    session = AsyncMock()
    with pytest.raises(team_service.TeamStateError):
        await team_service.remove_member(
            session, tenant_id=actor.tenant_id, actor=actor, user_id=actor.id
        )


@pytest.mark.asyncio
async def test_update_last_owner_role_blocked() -> None:
    tenant_id = uuid4()
    owner = _user(tenant_id=tenant_id, role="owner")
    actor = owner
    session = AsyncMock()
    session.execute = AsyncMock(
        side_effect=[
            MagicMock(scalar_one_or_none=lambda: owner),  # get_member
            MagicMock(scalar_one=lambda: 1),  # count owners
        ]
    )
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    with pytest.raises(team_service.TeamStateError):
        await team_service.update_member(
            session,
            tenant_id=tenant_id,
            actor=actor,
            user_id=owner.id,
            payload=TeamMemberUpdate(role="admin"),
        )
