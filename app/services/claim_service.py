from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.schemas.claim import ClaimAnalyzeRequest, ClaimAnalyzeResponse
from app.security import TenantContext
from app.services.storage_service import upload_claim_image
from app.tasks.claim_tasks import process_claim_task


class ClaimAlreadyExistsError(Exception):
    def __init__(self, claim_id: str) -> None:
        self.claim_id = claim_id
        super().__init__(f"Claim {claim_id} already exists for this tenant")


class ClaimIntakeError(Exception):
    pass


async def submit_claim_for_analysis(
    db: AsyncSession,
    tenant_ctx: TenantContext,
    payload: ClaimAnalyzeRequest,
) -> ClaimAnalyzeResponse:
    existing = await db.execute(
        select(Claim).where(
            Claim.tenant_id == tenant_ctx.tenant_id,
            Claim.external_claim_id == payload.claim_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ClaimAlreadyExistsError(payload.claim_id)

    uploaded_images = []
    for image in payload.images:
        uploaded = await upload_claim_image(
            tenant_id=str(tenant_ctx.tenant_id),
            claim_id=payload.claim_id,
            filename=image.filename,
            content_base64=image.content_base64,
            content_type=image.content_type,
        )
        uploaded_images.append(
            {
                "path": uploaded.path,
                "filename": uploaded.filename,
                "content_type": uploaded.content_type,
                "size_bytes": uploaded.size_bytes,
            }
        )

    metadata = dict(payload.metadata)
    metadata["images"] = uploaded_images

    claim = Claim(
        tenant_id=tenant_ctx.tenant_id,
        external_claim_id=payload.claim_id,
        status="processing",
        device_category=payload.device_category,
        serial_number_input=payload.serial_number_input,
        purchase_date=payload.purchase_date,
        claim_date=payload.claim_date,
        damage_description=payload.damage_description,
        policy_id=payload.policy_id,
        metadata_=metadata,
    )
    db.add(claim)
    await db.flush()
    await db.commit()
    await db.refresh(claim)

    try:
        process_claim_task.delay(str(claim.id))
    except Exception as exc:
        raise RuntimeError(f"Failed to enqueue claim for processing: {exc}") from exc

    return ClaimAnalyzeResponse(
        claim_id=claim.external_claim_id,
        internal_id=claim.id,
        status=claim.status,
        image_count=len(uploaded_images),
        submitted_at=claim.created_at or datetime.now(UTC),
    )
