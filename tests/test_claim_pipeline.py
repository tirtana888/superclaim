import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.models.claim import Claim
from app.schemas.decision import ClaimDecisionResult
from app.services.claim_pipeline import run_claim_analysis


@pytest.mark.asyncio
async def test_run_claim_analysis_persists_decision() -> None:
    claim_id = uuid4()
    claim = Claim(
        id=claim_id,
        tenant_id=uuid4(),
        external_claim_id="CLM-PIPE-001",
        status="processing",
        device_category="smartphone",
        serial_number_input="SN999",
        policy_id="POL-001",
        metadata_={"images": [{"path": "tenant/CLM-PIPE-001/photo.jpg"}]},
    )
    decision = ClaimDecisionResult(
        claim_id="CLM-PIPE-001",
        decision="APPROVE",
        confidence_score=0.91,
        fraud_score=0.1,
        processing_time_ms=100,
        ai_cost_usd=0.02,
    )

    session = AsyncMock()
    session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: claim)
    )
    session.commit = AsyncMock()

    session_factory = MagicMock()
    session_factory.return_value.__aenter__ = AsyncMock(return_value=session)
    session_factory.return_value.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.claim_pipeline.get_session_factory", return_value=session_factory), patch(
        "app.services.claim_pipeline._download_claim_images",
        new_callable=AsyncMock,
        return_value=[(b"image-bytes", "tenant/CLM-PIPE-001/photo.jpg")],
    ), patch(
        "app.services.claim_pipeline.analyze_duplicates_and_exif",
        new_callable=AsyncMock,
    ) as mock_duplicate, patch(
        "app.services.claim_pipeline.analyze_claim_image",
        new_callable=AsyncMock,
    ), patch(
        "app.services.claim_pipeline.extract_serial_from_image",
        new_callable=AsyncMock,
    ), patch(
        "app.services.claim_pipeline.evaluate_policy",
        new_callable=AsyncMock,
    ), patch(
        "app.services.claim_pipeline.score_fraud",
        new_callable=AsyncMock,
    ), patch(
        "app.services.claim_pipeline.build_decision",
        return_value=decision,
    ):
        from app.schemas.duplicate import DuplicateAnalysisResult

        mock_duplicate.return_value = DuplicateAnalysisResult(is_duplicate=False)

        result = await run_claim_analysis(str(claim_id))

    assert result.decision == "APPROVE"
    assert claim.status == "approved"
    assert claim.metadata_["analysis_result"]["decision"] == "APPROVE"
    assert session.commit.await_count >= 2
