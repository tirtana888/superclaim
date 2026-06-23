"""Unit tests for credential_service."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.api_credential import ApiCredential
from app.schemas.control import ApiCredentialCreate
from app.services import credential_service


def _credential(**kwargs) -> ApiCredential:
    defaults = {
        "id": uuid4(),
        "tenant_id": uuid4(),
        "key_id": "sck_abc123",
        "secret_hash": "hash",
        "label": "Production",
        "scopes": ["claims:analyze"],
        "status": "active",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    defaults.update(kwargs)
    return ApiCredential(**defaults)


@pytest.mark.asyncio
async def test_get_credential_not_found() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: None))
    with pytest.raises(credential_service.CredentialNotFoundError):
        await credential_service.get_credential(session, uuid4(), uuid4())


@pytest.mark.asyncio
async def test_create_credential_returns_secret_once() -> None:
    tenant_id = uuid4()
    session = AsyncMock()
    added: list[ApiCredential] = []

    def _add(obj: ApiCredential) -> None:
        obj.id = uuid4()
        added.append(obj)

    session.add = MagicMock(side_effect=_add)
    session.commit = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()

    with patch("app.services.credential_service.generate_api_secret", return_value="scs_testsecret"):
        with patch("app.services.credential_service.generate_key_id", return_value="sck_testkey"):
            with patch("app.services.credential_service.hash_secret", return_value="hashed"):
                result = await credential_service.create_credential(
                    session,
                    tenant_id=tenant_id,
                    payload=ApiCredentialCreate(label="Dev key"),
                )

    assert result.secret == "scs_testsecret"
    assert result.key_id == "sck_testkey"
    assert result.label == "Dev key"
    assert len(added) == 1
    assert added[0].tenant_id == tenant_id
    assert added[0].secret_hash == "hashed"


@pytest.mark.asyncio
async def test_revoke_already_revoked_raises() -> None:
    cred = _credential(status="revoked")
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: cred))
    with pytest.raises(credential_service.CredentialStateError):
        await credential_service.revoke_credential(
            session, tenant_id=cred.tenant_id, credential_id=cred.id
        )


@pytest.mark.asyncio
async def test_list_credentials_never_returns_secret_hash() -> None:
    cred = _credential()
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalars=lambda: MagicMock(all=lambda: [cred])))
    items = await credential_service.list_credentials(session, cred.tenant_id)
    out = credential_service.credential_to_out(items[0])
    assert not hasattr(out, "secret")
    assert out.key_id == "sck_abc123"
