"""Tests for public brand claim submit API."""

from datetime import date
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models.tenant import Tenant


class FakeResult:
    def __init__(self, scalar=None):
        self._scalar = scalar

    def scalar_one_or_none(self):
        return self._scalar


class FakeSession:
    def __init__(self, tenant: Tenant | None):
        self.tenant = tenant
        self.committed = False

    async def execute(self, *_args, **_kwargs):
        return FakeResult(self.tenant)

    def add(self, _obj):
        pass

    async def flush(self):
        pass

    async def commit(self):
        self.committed = True

    async def refresh(self, _obj):
        pass


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_public_brand_not_found(client: TestClient) -> None:
    async def _dep():
        yield FakeSession(None)

    app.dependency_overrides[get_db] = _dep
    resp = client.get("/api/public/brands/unknown-brand")
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_public_brand_found(client: TestClient) -> None:
    tenant = Tenant(
        id=uuid4(),
        name="Acme",
        slug="acme",
        status="active",
        plan_tier="trial",
        api_key_hash="x" * 64,
        is_active=True,
    )

    async def _dep():
        yield FakeSession(tenant)

    app.dependency_overrides[get_db] = _dep
    resp = client.get("/api/public/brands/acme")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme"
