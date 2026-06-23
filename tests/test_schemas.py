import pytest

from app.schemas.claim import ClaimAnalyzeRequest, ClaimImageInput


def test_claim_image_input_sanitizes_filename() -> None:
    image = ClaimImageInput(
        filename="../../etc/passwd",
        content_base64="dGVzdA==",
    )
    assert image.filename == "passwd"


def test_claim_analyze_request_requires_images() -> None:
    with pytest.raises(ValueError):
        ClaimAnalyzeRequest(
            claim_id="CLM-1",
            device_category="phone",
            images=[],
        )
