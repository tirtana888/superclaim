import io
from datetime import date
from uuid import uuid4

import pytest
from PIL import Image

from app.services.duplicate_service import (
    analyze_exif_flags,
    compute_image_hashes,
    extract_exif,
    hamming_distance,
)


def _make_test_image(
    color: tuple[int, int, int] = (255, 0, 0),
    software: str | None = None,
    pattern: str | None = None,
) -> bytes:
    image = Image.new("RGB", (64, 64), color=color)
    if pattern == "checkerboard":
        pixels = image.load()
        for y in range(64):
            for x in range(64):
                pixels[x, y] = (255, 255, 255) if (x + y) % 2 == 0 else (0, 0, 0)
    if software:
        exif = image.getexif()
        exif[0x0131] = software  # Software tag
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", exif=exif)
        return buffer.getvalue()

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_compute_image_hashes_is_stable() -> None:
    image_bytes = _make_test_image()
    first = compute_image_hashes(image_bytes)
    second = compute_image_hashes(image_bytes)
    assert first == second


def test_hamming_distance_identical_hashes() -> None:
    image_bytes = _make_test_image()
    phash, _ = compute_image_hashes(image_bytes)
    assert hamming_distance(phash, phash) == 0


def test_hamming_distance_different_images() -> None:
    solid = compute_image_hashes(_make_test_image((255, 0, 0)))[0]
    patterned = compute_image_hashes(_make_test_image(pattern="checkerboard"))[0]
    assert hamming_distance(solid, patterned) > 0


def test_extract_exif_detects_software() -> None:
    image_bytes = _make_test_image(software="Adobe Photoshop CC")
    exif = extract_exif(image_bytes)
    assert exif.get("Software") == "Adobe Photoshop CC"


def test_analyze_exif_flags_editing_software() -> None:
    flags = analyze_exif_flags({"Software": "Adobe Photoshop CC"}, claim_date=None)
    codes = {flag.code for flag in flags}
    assert "EDITING_SOFTWARE_DETECTED" in codes


def test_analyze_exif_flags_missing_exif() -> None:
    flags = analyze_exif_flags({}, claim_date=None)
    assert flags[0].code == "EXIF_MISSING"


def test_analyze_exif_flags_date_after_claim() -> None:
    flags = analyze_exif_flags(
        {"DateTimeOriginal": "2025:06:15 10:00:00"},
        claim_date=date(2025, 6, 1),
    )
    codes = {flag.code for flag in flags}
    assert "EXIF_DATE_AFTER_CLAIM" in codes


@pytest.mark.asyncio
async def test_analyze_duplicates_and_exif_detects_similar_claim() -> None:
    from unittest.mock import AsyncMock, MagicMock

    from app.services.duplicate_service import analyze_duplicates_and_exif

    image_bytes = _make_test_image((120, 120, 120))
    phash, dhash = compute_image_hashes(image_bytes)

    tenant_id = uuid4()
    current_claim_id = uuid4()
    prior_claim_id = uuid4()

    prior_hash = MagicMock()
    prior_hash.phash = phash
    prior_hash.dhash = dhash

    mock_result = MagicMock()
    mock_result.all.return_value = [(prior_hash, "CLM-PRIOR-001")]

    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)
    session.add = MagicMock()
    session.flush = AsyncMock()

    result = await analyze_duplicates_and_exif(
        session,
        tenant_id=tenant_id,
        claim_id=current_claim_id,
        images=[(image_bytes, f"{tenant_id}/CLM-NEW-001/photo.jpg")],
        claim_date=date(2025, 6, 1),
    )

    assert result.is_duplicate is True
    assert "CLM-PRIOR-001" in result.similar_claim_ids
    assert result.duplicate_score > 0.9
    session.add.assert_called_once()
