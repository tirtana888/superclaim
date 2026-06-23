import asyncio
import logging
import time
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session_factory
from app.models.claim import Claim
from app.schemas.decision import ClaimDecisionResult
from app.services.decision_service import build_decision
from app.services.duplicate_service import analyze_duplicates_and_exif
from app.services.fraud_service import score_fraud
from app.services.ocr_service import extract_serial_from_image
from app.services.policy_engine import evaluate_policy
from app.services.storage_service import create_signed_url, download_claim_image
from app.services.vision_service import analyze_claim_image

logger = logging.getLogger(__name__)

DECISION_STATUS_MAP = {
    "APPROVE": "approved",
    "REJECT": "rejected",
    "REVIEW": "review",
}


async def _load_claim(db: AsyncSession, claim_id: UUID) -> Claim:
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if claim is None:
        raise ValueError(f"Claim {claim_id} not found")
    return claim


async def _download_claim_images(claim: Claim) -> list[tuple[bytes, str]]:
    images_meta = claim.metadata_.get("images", [])
    downloaded: list[tuple[bytes, str]] = []
    for image in images_meta:
        path = image.get("path")
        if not path:
            continue
        content = await download_claim_image(path)
        downloaded.append((content, path))
    if not downloaded:
        raise ValueError(f"No images found for claim {claim.id}")
    return downloaded


async def run_claim_analysis(claim_id: str) -> ClaimDecisionResult:
    """Run the full claim analysis pipeline and persist the decision."""
    started = time.perf_counter()
    claim_uuid = UUID(claim_id)
    session_factory = get_session_factory()

    async with session_factory() as db:
        claim = await _load_claim(db, claim_uuid)
        claim.status = "processing"
        await db.commit()

        images = await _download_claim_images(claim)
        primary_path = images[0][1]
        signed_url = await create_signed_url(primary_path)

        duplicate_result = await analyze_duplicates_and_exif(
            db,
            tenant_id=claim.tenant_id,
            claim_id=claim.id,
            images=images,
            claim_date=claim.claim_date,
        )

        vision_result = None
        ocr_result = None
        device_category = claim.device_category or "unknown"

        try:
            vision_result = await analyze_claim_image(signed_url, device_category)
        except Exception as exc:
            logger.warning("Vision analysis failed for claim %s: %s", claim_id, exc)

        try:
            ocr_result = await extract_serial_from_image(
                image_url=signed_url,
                serial_number_input=claim.serial_number_input,
            )
        except Exception as exc:
            logger.warning("OCR analysis failed for claim %s: %s", claim_id, exc)

        damage_type = vision_result.damage_type if vision_result else None
        policy_result = await evaluate_policy(
            db,
            tenant_id=claim.tenant_id,
            claim_id=claim.id,
            external_policy_id=claim.policy_id,
            device_category=device_category,
            damage_description=claim.damage_description,
            damage_type=damage_type,
            purchase_date=claim.purchase_date,
            claim_date=claim.claim_date,
            serial_number=claim.serial_number_input,
        )

        fraud_result = await score_fraud(
            db,
            tenant_id=claim.tenant_id,
            claim_id=claim.id,
            purchase_date=claim.purchase_date,
            claim_date=claim.claim_date,
            damage_description=claim.damage_description,
            serial_number=claim.serial_number_input,
            metadata=claim.metadata_,
            duplicate_result=duplicate_result,
            vision_result=vision_result,
            ocr_result=ocr_result,
        )

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        decision = build_decision(
            external_claim_id=claim.external_claim_id,
            policy_result=policy_result,
            duplicate_result=duplicate_result,
            fraud_result=fraud_result,
            vision_result=vision_result,
            ocr_result=ocr_result,
            processing_time_ms=elapsed_ms,
        )

        metadata = dict(claim.metadata_)
        metadata["analysis_result"] = decision.model_dump()
        claim.metadata_ = metadata
        claim.status = DECISION_STATUS_MAP[decision.decision]
        await db.commit()

        return decision


def run_claim_analysis_sync(claim_id: str) -> dict:
    """Sync entrypoint for Celery workers."""
    result = asyncio.run(run_claim_analysis(claim_id))
    return result.model_dump()
