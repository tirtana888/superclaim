import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.vision_service import analyze_claim_image


@pytest.fixture
def mock_gemini_response() -> MagicMock:
    payload = {
        "damage_type": "cracked_screen",
        "damage_severity": "moderate",
        "device_identified": "iPhone 14",
        "confidence": 0.91,
    }
    usage = MagicMock(prompt_token_count=1200, candidates_token_count=80)
    response = MagicMock()
    response.text = json.dumps(payload)
    response.usage_metadata = usage
    return response


@pytest.mark.asyncio
async def test_analyze_claim_image_with_bytes(mock_gemini_response: MagicMock) -> None:
    with patch("app.services.vision_service._get_client") as mock_client_factory:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_gemini_response
        mock_client_factory.return_value = mock_client

        result = await analyze_claim_image(
            "smartphone",
            image_bytes=b"fake-image-bytes",
            content_type="image/jpeg",
        )

    assert result.damage_type == "cracked_screen"
    mock_client.models.generate_content.assert_called_once()


@pytest.mark.asyncio
async def test_analyze_claim_image_success(mock_gemini_response: MagicMock) -> None:
    fake_image = b"fake-image-bytes"

    with patch(
        "app.services.vision_service._fetch_image",
        new_callable=AsyncMock,
        return_value=(fake_image, "image/jpeg"),
    ), patch("app.services.vision_service._get_client") as mock_client_factory:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_gemini_response
        mock_client_factory.return_value = mock_client

        result = await analyze_claim_image(
            "smartphone",
            image_url="https://example.com/signed.jpg",
        )

    assert result.damage_type == "cracked_screen"
    assert result.damage_severity == "moderate"
    assert result.device_identified == "iPhone 14"
    assert result.confidence == 0.91
    assert result.ai_cost_usd > 0
    assert result.raw_response["model"]


@pytest.mark.asyncio
async def test_analyze_claim_image_retries_on_failure(mock_gemini_response: MagicMock) -> None:
    fake_image = b"fake-image-bytes"

    with patch(
        "app.services.vision_service._fetch_image",
        new_callable=AsyncMock,
        return_value=(fake_image, "image/jpeg"),
    ), patch("app.services.vision_service._get_client") as mock_client_factory, patch(
        "app.services.vision_service.asyncio.sleep",
        new_callable=AsyncMock,
    ):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = [
            RuntimeError("temporary failure"),
            mock_gemini_response,
        ]
        mock_client_factory.return_value = mock_client

        result = await analyze_claim_image(
            "smartphone",
            image_url="https://example.com/signed.jpg",
        )

    assert result.damage_type == "cracked_screen"
    assert mock_client.models.generate_content.call_count == 2


@pytest.mark.asyncio
async def test_analyze_claim_image_raises_after_retries() -> None:
    with patch(
        "app.services.vision_service._fetch_image",
        new_callable=AsyncMock,
        return_value=(b"img", "image/jpeg"),
    ), patch("app.services.vision_service._get_client") as mock_client_factory, patch(
        "app.services.vision_service.asyncio.sleep",
        new_callable=AsyncMock,
    ):
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = RuntimeError("always fails")
        mock_client_factory.return_value = mock_client

        with pytest.raises(RuntimeError, match="failed after 3 attempts"):
            await analyze_claim_image(
                "smartphone",
                image_url="https://example.com/signed.jpg",
            )
