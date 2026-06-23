"""Tests for platform superadmin auth and admin API."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security import (
    create_access_token,
    create_platform_access_token,
    hash_password,
)
from app.database import get_db
from app.main import app
from app.models.platform_admin import PlatformAdmin
from app.models.tenant import Tenant
from app.models.user import User


class FakeResult:
    def __init__(self, scalar=None, scalars_list=None, rows=None):
        self._scalar = scalar
        self._scalars_list = scalars_list or []
        self._rows = rows or []

    def scalar_one_or_none(self):
        return self._scalar

    def scalar_one(self):
        return self._scalar

    def scalars(self):
        outer = self

        class _S:
            def all(self_inner):
                return outer._scalars_list

        return _S()

    def all(self):
        return self._rows


class FakeSession:
    def __init__(self, execute_results):
        self._results = list(execute_results)
        self.added = []

    async def execute(self, *_args, **_kwargs):
        return self._results.pop(0)

    def add(self, obj):
        self.added.append(obj)
        if getattr(obj, "id", None) is None:
            obj.id = uuid4()

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def refresh(self, obj):
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(UTC)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _override_db(session: FakeSession) -> None:
    async def _dep():
        yield session

    app.dependency_overrides[get_db] = _dep


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_platform_admin_login(client: TestClient) -> None:
    admin = PlatformAdmin(
        id=uuid4(),
        email="admin@superclaim.ai",
        password_hash=hash_password("supersecret"),
        status="active",
    )
    session = FakeSession([FakeResult(scalar=admin)])
    _override_db(session)

    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@superclaim.ai", "password": "supersecret"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["platform_admin"]["email"] == "admin@superclaim.ai"
    assert body["user"] is None
    assert body["tenant"] is None
    assert body["tokens"]["access_token"]


def test_tenant_user_cannot_access_admin_api(client: TestClient) -> None:
    tenant_id = uuid4()
    user_id = uuid4()
    token = create_access_token(user_id=user_id, tenant_id=tenant_id, role="owner")
    user = User(
        id=user_id,
        tenant_id=tenant_id,
        email="owner@acme.io",
        password_hash="x",
        role="owner",
        status="active",
    )
    tenant = Tenant(
        id=tenant_id,
        name="Acme",
        slug="acme",
        status="active",
        plan_tier="trial",
        api_key_hash="x" * 64,
        is_active=True,
    )
    session = FakeSession([])
    _override_db(session)

    resp = client.get(
        "/api/admin/tenants",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


def test_platform_admin_can_list_tenants(client: TestClient) -> None:
    admin_id = uuid4()
    token = create_platform_access_token(admin_id=admin_id)
    admin = PlatformAdmin(
        id=admin_id,
        email="admin@superclaim.ai",
        password_hash="x",
        status="active",
    )
    tenant = Tenant(
        id=uuid4(),
        name="Acme",
        slug="acme",
        status="active",
        plan_tier="trial",
        api_key_hash="x" * 64,
        is_active=True,
        created_at=datetime.now(UTC),
    )
    session = FakeSession(
        [
            FakeResult(scalar=admin),
            FakeResult(rows=[(tenant, 2, 5)]),
        ]
    )
    _override_db(session)

    resp = client.get(
        "/api/admin/tenants",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["tenants"]) == 1
    assert body["tenants"][0]["name"] == "Acme"
    assert body["tenants"][0]["user_count"] == 2
    assert body["tenants"][0]["claim_count"] == 5
