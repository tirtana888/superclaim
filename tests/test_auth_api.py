"""Integration-style tests for the Control Plane auth endpoints."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, create_refresh_token, hash_password
from app.database import get_db
from app.main import app
from app.models.tenant import Tenant
from app.models.user import User


class FakeResult:
    def __init__(self, scalar=None, scalars_list=None):
        self._scalar = scalar
        self._scalars_list = scalars_list or []

    def scalar_one_or_none(self):
        return self._scalar

    def scalars(self):
        outer = self

        class _S:
            def all(self_inner):
                return outer._scalars_list

        return _S()


class FakeSession:
    """Minimal async session double that assigns ids on add()."""

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
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()

    async def commit(self):
        return None

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


def test_signup_creates_owner_and_tokens(client: TestClient) -> None:
    session = FakeSession([FakeResult(scalar=None)])  # slug uniqueness check
    _override_db(session)

    resp = client.post(
        "/api/auth/signup",
        json={"tenant_name": "Acme Corp", "email": "owner@acme.io", "password": "supersecret"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["user"]["email"] == "owner@acme.io"
    assert body["user"]["role"] == "owner"
    assert body["tenant"]["slug"] == "acme-corp"
    assert body["tokens"]["access_token"]
    assert body["tokens"]["refresh_token"]


def test_login_success(client: TestClient) -> None:
    tenant_id = uuid4()
    user = User(
        id=uuid4(),
        tenant_id=tenant_id,
        email="owner@acme.io",
        password_hash=hash_password("supersecret"),
        role="owner",
        status="active",
    )
    tenant = Tenant(
        id=tenant_id, name="Acme", slug="acme", status="active", plan_tier="trial",
        api_key_hash="x" * 64, is_active=True,
    )
    session = FakeSession([FakeResult(scalar=None), FakeResult(scalars_list=[user]), FakeResult(scalar=tenant)])
    _override_db(session)

    resp = client.post(
        "/api/auth/login",
        json={"email": "owner@acme.io", "password": "supersecret"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["tokens"]["access_token"]


def test_login_wrong_password_rejected(client: TestClient) -> None:
    user = User(
        id=uuid4(), tenant_id=uuid4(), email="owner@acme.io",
        password_hash=hash_password("supersecret"), role="owner", status="active",
    )
    session = FakeSession([FakeResult(scalar=None), FakeResult(scalars_list=[user])])
    _override_db(session)

    resp = client.post(
        "/api/auth/login",
        json={"email": "owner@acme.io", "password": "WRONG"},
    )
    assert resp.status_code == 401


def test_login_ambiguous_requires_slug(client: TestClient) -> None:
    u1 = User(id=uuid4(), tenant_id=uuid4(), email="a@b.io",
              password_hash=hash_password("p"), role="owner", status="active")
    u2 = User(id=uuid4(), tenant_id=uuid4(), email="a@b.io",
              password_hash=hash_password("p"), role="owner", status="active")
    session = FakeSession([FakeResult(scalar=None), FakeResult(scalars_list=[u1, u2])])
    _override_db(session)

    resp = client.post("/api/auth/login", json={"email": "a@b.io", "password": "p"})
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "AMBIGUOUS_LOGIN"


def test_refresh_issues_new_tokens(client: TestClient) -> None:
    tenant_id, user_id = uuid4(), uuid4()
    user = User(id=user_id, tenant_id=tenant_id, email="o@a.io",
                password_hash=hash_password("p"), role="owner", status="active")
    session = FakeSession([FakeResult(scalar=user)])
    _override_db(session)

    refresh_token = create_refresh_token(user_id=user_id, tenant_id=tenant_id, role="owner")
    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200, resp.text
    assert resp.json()["access_token"]


def test_refresh_rejects_access_token(client: TestClient) -> None:
    _override_db(FakeSession([]))
    access = create_access_token(user_id=uuid4(), tenant_id=uuid4(), role="owner")
    resp = client.post("/api/auth/refresh", json={"refresh_token": access})
    assert resp.status_code == 401


def test_me_requires_token(client: TestClient) -> None:
    _override_db(FakeSession([]))
    resp = client.get("/api/auth/me")
    assert resp.status_code == 422  # missing Authorization header


def test_me_returns_current_user(client: TestClient) -> None:
    tenant_id, user_id = uuid4(), uuid4()
    user = User(id=user_id, tenant_id=tenant_id, email="o@a.io",
                password_hash=hash_password("p"), role="owner", status="active")
    tenant = Tenant(id=tenant_id, name="Acme", slug="acme", status="active",
                    plan_tier="trial", api_key_hash="x" * 64, is_active=True)
    session = FakeSession([FakeResult(scalar=user), FakeResult(scalar=tenant)])
    _override_db(session)

    token = create_access_token(user_id=user_id, tenant_id=tenant_id, role="owner")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["user"]["id"] == str(user_id)


def test_me_cross_tenant_token_rejected(client: TestClient) -> None:
    """A token whose tenant doesn't match the user row resolves to no user (isolation)."""
    token = create_access_token(user_id=uuid4(), tenant_id=uuid4(), role="owner")
    session = FakeSession([FakeResult(scalar=None)])  # tenant-scoped lookup misses
    _override_db(session)

    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
