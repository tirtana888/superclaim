from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.ocr_service import (
    _match_serial,
    extract_serial_candidates,
    extract_serial_from_image,
)


def test_extract_serial_candidates_from_labeled_text() -> None:
    text = "Ticket #: 00005883\nS/N #: 520117260957\nDISPLAY FACE UP"
    serials = extract_serial_candidates(text)
    assert "520117260957" in serials


def test_extract_serial_candidates_imei() -> None:
    text = "IMEI: 356938035643809"
    serials = extract_serial_candidates(text)
    assert "356938035643809" in serials


def test_match_serial_fuzzy_match() -> None:
    best, matched, confidence = _match_serial(
        "520117260957",
        ["520117260958", "520117260957"],
    )
    assert best == "520117260957"
    assert matched is True
    assert confidence >= 0.85


def test_match_serial_no_input() -> None:
    best, matched, confidence = _match_serial(None, ["ABC123456789"])
    assert best == "ABC123456789"
    assert matched is None
    assert confidence == 0.75


@pytest.mark.asyncio
async def test_extract_serial_from_image_success() -> None:
    markdown = "S/N #: SN1234567890\nDevice label"
    mock_response = MagicMock()
    mock_response.model = "mistral-ocr-latest"
    mock_response.usage_info = MagicMock(pages_processed=1)

    with patch(
        "app.services.ocr_service._call_mistral_ocr",
        return_value=(markdown, mock_response, 0.001),
    ):
        result = await extract_serial_from_image(
            image_url="https://example.com/signed.jpg",
            serial_number_input="SN1234567890",
        )

    assert "SN1234567890" in result.serial_numbers_found
    assert result.best_match == "SN1234567890"
    assert result.match_with_input is True
    assert result.ai_cost_usd == 0.001


@pytest.mark.asyncio
async def test_extract_serial_from_image_retries() -> None:
    markdown = "Serial Number: ABC999888777"
    mock_response = MagicMock()
    mock_response.model = "mistral-ocr-latest"
    mock_response.usage_info = MagicMock(pages_processed=1)

    with patch(
        "app.services.ocr_service._call_mistral_ocr",
        side_effect=[
            RuntimeError("temporary"),
            (markdown, mock_response, 0.001),
        ],
    ), patch("app.services.ocr_service.asyncio.sleep", new_callable=AsyncMock):
        result = await extract_serial_from_image(
            content_base64="dGVzdA==",
            serial_number_input=None,
        )

    assert result.best_match == "ABC999888777"
    assert result.serial_numbers_found


@pytest.mark.asyncio
async def test_extract_serial_from_image_raises_after_retries() -> None:
    with patch(
        "app.services.ocr_service._call_mistral_ocr",
        side_effect=RuntimeError("always fails"),
    ), patch("app.services.ocr_service.asyncio.sleep", new_callable=AsyncMock):
        with pytest.raises(RuntimeError, match="failed after 3 attempts"):
            await extract_serial_from_image(image_url="https://example.com/img.jpg")
