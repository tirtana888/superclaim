"""Integration-style tests for Control Plane device registry API."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, get_current_tenant, get_current_user
from app.database import get_db
from app.main import app
from app.models.device import Device
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
    def __init__(self, execute_results):
        self._results = list(execute_results)
        self.added = []

    async def execute(self, *_args, **_kwargs):
        if self._results:
            return self._results.pop(0)
        return FakeResult()

    def add(self, obj):
        self.added.append(obj)
        if getattr(obj, "id", None) is None:
            obj.id = uuid4()

    async def commit(self):
        pass

    async def refresh(self, obj):
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(UTC)
        if getattr(obj, "updated_at", None) is None:
            obj.updated_at = datetime.now(UTC)

    async def rollback(self):
        pass

    async def delete(self, obj):
        pass


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def tenant_a() -> Tenant:
    return Tenant(
        id=uuid4(),
        name="Tenant A",
        slug="tenant-a",
        status="active",
        plan_tier="trial",
        api_key_hash="a" * 64,
        is_active=True,
    )


@pytest.fixture
def owner_a(tenant_a: Tenant) -> User:
    return User(
        id=uuid4(),
        tenant_id=tenant_a.id,
        email="owner@a.io",
        password_hash="x",
        role="owner",
        status="active",
    )


def _auth_headers(user: User, tenant: Tenant) -> dict[str, str]:
    token = create_access_token(user_id=user.id, tenant_id=tenant.id, role=user.role)
    return {"Authorization": f"Bearer {token}"}


def _override_auth(user: User, tenant: Tenant, session: FakeSession) -> None:
    async def _user():
        return user

    async def _tenant():
        return tenant

    async def _db():
        yield session

    app.dependency_overrides[get_current_user] = _user
    app.dependency_overrides[get_current_tenant] = _tenant
    app.dependency_overrides[get_db] = _db


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_list_devices(client: TestClient, tenant_a: Tenant, owner_a: User) -> None:
    device = Device(
        id=uuid4(),
        tenant_id=tenant_a.id,
        serial_number="SN-001",
        device_category="smartphone",
        source="manual",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    session = FakeSession([FakeResult(scalars_list=[device])])
    _override_auth(owner_a, tenant_a, session)

    resp = client.get("/api/devices", headers=_auth_headers(owner_a, tenant_a))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] == 1
    assert body["devices"][0]["serial_number"] == "SN-001"


def test_get_device_cross_tenant_returns_404(
    client: TestClient, tenant_a: Tenant, owner_a: User
) -> None:
    session = FakeSession([FakeResult(scalar=None)])
    _override_auth(owner_a, tenant_a, session)

    resp = client.get(
        f"/api/devices/{uuid4()}",
        headers=_auth_headers(owner_a, tenant_a),
    )
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "DEVICE_NOT_FOUND"


def test_create_device_reviewer_forbidden(
    client: TestClient, tenant_a: Tenant
) -> None:
    reviewer = User(
        id=uuid4(),
        tenant_id=tenant_a.id,
        email="rev@a.io",
        password_hash="x",
        role="reviewer",
        status="active",
    )
    _override_auth(reviewer, tenant_a, FakeSession([]))

    resp = client.post(
        "/api/devices",
        headers=_auth_headers(reviewer, tenant_a),
        json={"serial_number": "SN-NEW", "device_category": "phone"},
    )
    assert resp.status_code == 403


def test_create_device_success(client: TestClient, tenant_a: Tenant, owner_a: User) -> None:
    session = FakeSession([])
    _override_auth(owner_a, tenant_a, session)

    resp = client.post(
        "/api/devices",
        headers=_auth_headers(owner_a, tenant_a),
        json={
            "serial_number": "SN-NEW",
            "device_category": "smartphone",
            "purchase_date": "2024-01-15",
            "warranty_months": 12,
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["serial_number"] == "SN-NEW"
    assert body["warranty_months"] == 12
    assert len(session.added) == 1


def test_get_by_serial(client: TestClient, tenant_a: Tenant, owner_a: User) -> None:
    device = Device(
        id=uuid4(),
        tenant_id=tenant_a.id,
        serial_number="SN-LOOKUP",
        device_category="tablet",
        source="import",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    session = FakeSession([FakeResult(scalar=device)])
    _override_auth(owner_a, tenant_a, session)

    resp = client.get(
        "/api/devices/by-serial/SN-LOOKUP",
        headers=_auth_headers(owner_a, tenant_a),
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["device_category"] == "tablet"
