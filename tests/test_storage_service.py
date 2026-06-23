import base64

import pytest

from app.services.storage_service import (
    SIGNED_URL_EXPIRY_SECONDS,
    build_storage_path,
    decode_image_content,
)


TINY_PNG = base64.b64encode(
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
).decode()


def test_build_storage_path() -> None:
    path = build_storage_path("tenant-1", "CLM-001", "photo.jpg")
    assert path == "tenant-1/CLM-001/photo.jpg"


def test_decode_image_content_accepts_data_uri() -> None:
    content = decode_image_content(f"data:image/jpeg;base64,{TINY_PNG}")
    assert len(content) > 0


def test_decode_image_content_rejects_invalid_base64() -> None:
    with pytest.raises(ValueError, match="Invalid base64"):
        decode_image_content("not-valid-base64!!!")


@pytest.mark.asyncio
async def test_create_signed_url() -> None:
    from unittest.mock import MagicMock, patch

    from app.services.storage_service import create_signed_url

    with patch("app.services.storage_service.get_supabase_client") as mock_client:
        storage = MagicMock()
        storage.from_.return_value.create_signed_url.return_value = {
            "signedURL": "https://example.com/signed"
        }
        mock_client.return_value.storage = storage

        url = await create_signed_url("tenant/claim/file.jpg")
        assert url == "https://example.com/signed"
        storage.from_.return_value.create_signed_url.assert_called_once_with(
            "tenant/claim/file.jpg",
            SIGNED_URL_EXPIRY_SECONDS,
        )
