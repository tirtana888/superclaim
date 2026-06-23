"""Control Plane claim read endpoints (JWT) — same tenant data as Data Plane list."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant, get_current_user
from app.database import get_db
from app.models.claim import Claim
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.claim import ClaimListResponse, ClaimSummary
from app.schemas.decision import ClaimDecisionResult

router = APIRouter(prefix="/api/claims", tags=["claims-control"])


@router.get("", response_model=ClaimListResponse)
async def list_claims(
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=200),
) -> ClaimListResponse:
    result = await db.execute(
        select(Claim)
        .where(Claim.tenant_id == tenant.id)
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


@router.get("/{external_claim_id}", response_model=ClaimDecisionResult)
async def get_claim_analysis(
    external_claim_id: str,
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> ClaimDecisionResult:
    result = await db.execute(
        select(Claim).where(
            Claim.tenant_id == tenant.id,
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
