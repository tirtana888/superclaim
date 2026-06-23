from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.models.claim import Claim
from app.schemas.claim import ClaimListResponse, ClaimSummary, ErrorResponse
from app.schemas.decision import ClaimDecisionResult
from app.security import AuthenticatedContext, get_authenticated_context

router = APIRouter(prefix="/v1/claims", tags=["claims"])


@router.get("", response_model=ClaimListResponse)
async def list_claims(
    auth: AuthenticatedContext = Depends(get_authenticated_context),
    limit: int = Query(default=100, ge=1, le=200),
) -> ClaimListResponse:
    result = await auth.db.execute(
        select(Claim)
        .where(Claim.tenant_id == auth.tenant.tenant_id)
        .order_by(Claim.created_at.desc())
        .limit(limit)
    )
    claims = result.scalars().all()
    return ClaimListResponse(
        claims=[
            ClaimSummary(
                id=claim.id,
                external_claim_id=claim.external_claim_id,
                status=claim.status,
                device_category=claim.device_category,
                serial_number_input=claim.serial_number_input,
                created_at=claim.created_at,
                metadata=claim.metadata_,
            )
            for claim in claims
        ]
    )


@router.get(
    "/{external_claim_id}",
    response_model=ClaimDecisionResult,
    responses={404: {"model": ErrorResponse}, 409: {"model": ErrorResponse}},
)
async def get_claim_result(
    external_claim_id: str,
    auth: AuthenticatedContext = Depends(get_authenticated_context),
) -> ClaimDecisionResult:
    result = await auth.db.execute(
        select(Claim).where(
            Claim.tenant_id == auth.tenant.tenant_id,
            Claim.external_claim_id == external_claim_id,
        )
    )
    claim = result.scalar_one_or_none()
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "CLAIM_NOT_FOUND",
                "message": f"Claim {external_claim_id} not found",
                "detail": None,
            },
        )

    analysis = claim.metadata_.get("analysis_result")
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CLAIM_PROCESSING",
                "message": "Claim is still processing",
                "detail": {"status": claim.status},
            },
        )

    return ClaimDecisionResult.model_validate(analysis)
