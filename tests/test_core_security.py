"""Unit tests for app/core/security.py and app/core/database.py."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.core.database import tenant_query
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_tenant_from_apikey,
    hash_password,
    hash_secret,
    require_role,
    verify_password,
    verify_secret,
)
from app.models.claim import Claim


def test_password_hash_roundtrip() -> None:
    h = hash_password("s3cret-pass")
    assert h != "s3cret-pass"
    assert verify_password("s3cret-pass", h) is True
    assert verify_password("wrong", h) is False


def test_secret_hash_roundtrip() -> None:
    h = hash_secret("scs_abc123")
    assert verify_secret("scs_abc123", h) is True
    assert verify_secret("nope", h) is False


def test_access_token_roundtrip() -> None:
    uid, tid = uuid4(), uuid4()
    token = create_access_token(user_id=uid, tenant_id=tid, role="owner")
    claims = decode_token(token, expected_type="access")
    assert claims["sub"] == str(uid)
    assert claims["tid"] == str(tid)
    assert claims["role"] == "owner"
    assert claims["type"] == "access"


def test_decode_token_wrong_type_rejected() -> None:
    token = create_refresh_token(user_id=uuid4(), tenant_id=uuid4(), role="admin")
    with pytest.raises(Exception):
        decode_token(token, expected_type="access")


def test_tenant_query_filters_by_tenant() -> None:
    tid = uuid4()
    stmt = tenant_query(Claim, tid)
    compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
    assert "tenant_id" in compiled
    # Postgres literal may omit UUID dashes depending on driver/dialect.
    assert str(tid).replace("-", "") in compiled.replace("-", "")


@pytest.mark.asyncio
async def test_require_role_allows_and_blocks() -> None:
    guard = require_role("owner", "admin")

    owner = MagicMock(role="owner")
    assert await guard(user=owner) is owner

    reviewer = MagicMock(role="reviewer")
    with pytest.raises(Exception):
        await guard(user=reviewer)


@pytest.mark.asyncio
async def test_get_tenant_from_apikey_resolves_owning_tenant() -> None:
    tenant_b_id = uuid4()
    secret = "scs_correct-secret"
    credential = MagicMock(
        key_id="sck_b",
        secret_hash=hash_secret(secret),
        status="active",
        expires_at=None,
        tenant_id=tenant_b_id,
        last_used_at=None,
    )
    tenant_b = MagicMock(id=tenant_b_id, is_active=True)

    session = AsyncMock()
    session.execute = AsyncMock(
        side_effect=[
            MagicMock(scalar_one_or_none=lambda: credential),
            MagicMock(scalar_one_or_none=lambda: tenant_b),
        ]
    )
    session.commit = AsyncMock()

    resolved = await get_tenant_from_apikey(key_id="sck_b", secret=secret, db=session)
    assert resolved.id == tenant_b_id


@pytest.mark.asyncio
async def test_get_tenant_from_apikey_rejects_wrong_secret() -> None:
    credential = MagicMock(
        key_id="sck_b",
        secret_hash=hash_secret("scs_real"),
        status="active",
        expires_at=None,
        tenant_id=uuid4(),
    )
    session = AsyncMock()
    session.execute = AsyncMock(
        side_effect=[MagicMock(scalar_one_or_none=lambda: credential)]
    )

    with pytest.raises(Exception):
        await get_tenant_from_apikey(key_id="sck_b", secret="scs_wrong", db=session)


@pytest.mark.asyncio
async def test_get_tenant_from_apikey_rejects_expired() -> None:
    secret = "scs_real"
    credential = MagicMock(
        key_id="sck_b",
        secret_hash=hash_secret(secret),
        status="active",
        expires_at=datetime.now(UTC) - timedelta(days=1),
        tenant_id=uuid4(),
    )
    session = AsyncMock()
    session.execute = AsyncMock(
        side_effect=[MagicMock(scalar_one_or_none=lambda: credential)]
    )

    with pytest.raises(Exception):
        await get_tenant_from_apikey(key_id="sck_b", secret=secret, db=session)
