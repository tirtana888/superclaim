import base64
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.security import AuthenticatedContext, TenantContext, hash_api_key


TINY_PNG = base64.b64encode(
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
).decode()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def tenant_id() -> str:
    return str(uuid4())


@pytest.fixture
def sample_payload(tenant_id: str) -> dict:
    return {
        "claim_id": "CLM-001",
        "device_category": "smartphone",
        "serial_number_input": "SN123456",
        "purchase_date": "2024-01-15",
        "claim_date": "2025-06-01",
        "damage_description": "Cracked screen",
        "policy_id": "POL-001",
        "images": [
            {
                "filename": "damage.jpg",
                "content_base64": TINY_PNG,
                "content_type": "image/jpeg",
            }
        ],
        "metadata": {"source": "globalbeli"},
    }


def test_analyze_claim_requires_auth(client: TestClient, sample_payload: dict) -> None:
    response = client.post("/v1/claims/analyze", json=sample_payload)
    assert response.status_code == 422


def test_analyze_claim_success(
    client: TestClient,
    tenant_id: str,
    sample_payload: dict,
) -> None:
    from app.models.tenant import Tenant

    tenant = Tenant(id=uuid4(), name="Test Tenant", api_key_hash=hash_api_key("secret-key"))
    tenant_ctx = TenantContext(tenant_id=tenant.id, tenant=tenant)
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: None))
    session.add = MagicMock()

    async def fake_flush() -> None:
        for call in session.add.call_args_list:
            claim_obj = call.args[0]
            if getattr(claim_obj, "id", None) is None:
                claim_obj.id = uuid4()

    session.flush = AsyncMock(side_effect=fake_flush)
    session.commit = AsyncMock()
    session.refresh = AsyncMock(
        side_effect=lambda obj: setattr(obj, "created_at", datetime.now(UTC))
    )

    auth_ctx = AuthenticatedContext(tenant=tenant_ctx, db=session)

    async def override_auth() -> AuthenticatedContext:
        return auth_ctx

    from app.security import get_authenticated_context

    app.dependency_overrides[get_authenticated_context] = override_auth

    with patch("app.services.claim_service.upload_claim_image", new_callable=AsyncMock) as mock_upload, patch(
        "app.services.claim_service.process_claim_task"
    ) as mock_task:
        mock_upload.return_value = MagicMock(
            path=f"{tenant_id}/CLM-001/damage.jpg",
            filename="damage.jpg",
            content_type="image/jpeg",
            size_bytes=128,
        )

        response = client.post(
            "/v1/claims/analyze",
            json=sample_payload,
            headers={
                "X-API-Key": "secret-key",
                "X-Tenant-ID": str(tenant.id),
            },
        )

    app.dependency_overrides.clear()

    assert response.status_code == 202, response.text
    body = response.json()
    assert body["claim_id"] == "CLM-001"
    assert body["status"] == "processing"
    assert body["image_count"] == 1
    mock_task.delay.assert_called_once()
