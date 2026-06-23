from datetime import date
from uuid import uuid4

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.schemas.duplicate import DuplicateAnalysisResult, ExifFlag
from app.schemas.fraud import FraudFeatureVector
from app.schemas.ocr import OcrAnalysisResult
from app.schemas.vision import VisionAnalysisResult
from app.services.fraud_service import (
    _rule_based_score,
    build_feature_vector,
    score_fraud,
)


def test_rule_based_score_high_duplicate() -> None:
    features = FraudFeatureVector(duplicate_score=0.95, ocr_match=0.0)
    score, contributions = _rule_based_score(features)
    assert score > 0.5
    assert contributions["duplicate_score"] > 0.0


def test_rule_based_score_low_risk() -> None:
    features = FraudFeatureVector(
        duplicate_score=0.0,
        ocr_match=1.0,
        exif_date_matches_claim=1.0,
        vision_confidence=0.95,
    )
    score, _ = _rule_based_score(features)
    assert score < 0.2


@pytest.mark.asyncio
async def test_build_feature_vector() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one=lambda: 2))

    duplicate = DuplicateAnalysisResult(
        is_duplicate=False,
        duplicate_score=0.1,
        exif_data={"image_0": {"Software": "Camera"}},
        exif_flags=[],
    )
    vision = VisionAnalysisResult(
        damage_type="cracked_screen",
        damage_severity="moderate",
        device_identified="iPhone",
        confidence=0.9,
        ai_cost_usd=0.01,
    )
    ocr = OcrAnalysisResult(
        serial_numbers_found=["SN123"],
        best_match="SN123",
        match_with_input=True,
        confidence=0.95,
        ai_cost_usd=0.001,
    )

    features = await build_feature_vector(
        session,
        tenant_id=uuid4(),
        claim_id=uuid4(),
        purchase_date=date(2024, 1, 1),
        claim_date=date(2024, 6, 1),
        damage_description="Cracked screen on phone",
        serial_number="SN123",
        metadata={"user_id": "user-1"},
        duplicate_result=duplicate,
        vision_result=vision,
        ocr_result=ocr,
    )

    assert features.days_since_purchase == (date(2024, 6, 1) - date(2024, 1, 1)).days
    assert features.damage_desc_length == len("Cracked screen on phone")
    assert features.has_exif == 1.0
    assert features.vision_confidence == 0.9
    assert features.ocr_match == 1.0


@pytest.mark.asyncio
async def test_score_fraud_uses_rule_fallback_when_model_missing() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one=lambda: 0))

    duplicate = DuplicateAnalysisResult(
        is_duplicate=True,
        duplicate_score=0.95,
        exif_flags=[
            ExifFlag(
                code="EXIF_DATE_AFTER_CLAIM",
                description="bad date",
                severity="high",
            )
        ],
    )

    with patch("app.services.fraud_service._load_model", return_value=None):
        result = await score_fraud(
            session,
            tenant_id=uuid4(),
            claim_id=uuid4(),
            purchase_date=date(2024, 1, 1),
            claim_date=date(2024, 6, 1),
            damage_description="Cracked screen",
            serial_number="SN123",
            metadata={"user_id": "user-1"},
            duplicate_result=duplicate,
        )

    assert result.model_source == "rule_based_fallback"
    assert result.fraud_score > 0.4
    assert result.risk_level in {"medium", "high", "critical"}


@pytest.mark.asyncio
async def test_score_fraud_uses_lightgbm_when_model_available() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one=lambda: 0))

    duplicate = DuplicateAnalysisResult(is_duplicate=False, duplicate_score=0.0)
    mock_model = MagicMock()
    mock_model.predict.return_value = [0.42]
    mock_model.feature_importance.return_value = [1.0] * 11

    with patch("app.services.fraud_service._load_model", return_value=mock_model):
        result = await score_fraud(
            session,
            tenant_id=uuid4(),
            claim_id=uuid4(),
            purchase_date=date(2024, 1, 1),
            claim_date=date(2024, 6, 1),
            damage_description="Cracked screen",
            serial_number="SN123",
            metadata={},
            duplicate_result=duplicate,
        )

    assert result.model_source == "lightgbm"
    assert result.fraud_score == 0.42
    assert result.risk_level == "medium"
