from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body


def test_storage_health_endpoint_ok() -> None:
    client = TestClient(app)
    with patch("app.main.check_storage_health", new_callable=AsyncMock) as mock_check:
        response = client.get("/health/storage")
    assert response.status_code == 200
    assert response.json()["storage"] == "ok"
    mock_check.assert_awaited_once()


def test_storage_health_endpoint_degraded() -> None:
    client = TestClient(app)
    with patch(
        "app.main.check_storage_health",
        new_callable=AsyncMock,
        side_effect=OSError("[Errno 101] Network is unreachable"),
    ):
        response = client.get("/health/storage")
    assert response.status_code == 503
    body = response.json()
    assert body["error_code"] == "STORAGE_UNAVAILABLE"

