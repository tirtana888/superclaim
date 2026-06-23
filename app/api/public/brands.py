"""Public brand endpoints (hosted claim page — no JWT)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.tenant import Tenant
from app.schemas.claim import ClaimAnalyzeRequest, ClaimAnalyzeResponse
from app.security import TenantContext
from app.services.claim_service import ClaimAlreadyExistsError, submit_claim_for_analysis
from pydantic import BaseModel

router = APIRouter(prefix="/api/public/brands", tags=["public"])


class PublicBrandOut(BaseModel):
    name: str
    slug: str


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


async def _tenant_by_slug(db: AsyncSession, slug: str) -> Tenant:
    result = await db.execute(
        select(Tenant).where(
            Tenant.slug == slug.strip().lower(),
            Tenant.is_active.is_(True),
            Tenant.status == "active",
        )
    )
    tenant = result.scalar_one_or_none()
    if tenant is None:
        raise _error("BRAND_NOT_FOUND", "Brand not found", status.HTTP_404_NOT_FOUND)
    return tenant


@router.get("/{slug}", response_model=PublicBrandOut)
async def get_brand(slug: str, db: AsyncSession = Depends(get_db)) -> PublicBrandOut:
    tenant = await _tenant_by_slug(db, slug)
    return PublicBrandOut(name=tenant.name, slug=tenant.slug or slug)


@router.post(
    "/{slug}/claims",
    response_model=ClaimAnalyzeResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def submit_public_claim(
    slug: str,
    payload: ClaimAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
) -> ClaimAnalyzeResponse:
    tenant = await _tenant_by_slug(db, slug)
    ctx = TenantContext(tenant_id=tenant.id, tenant=tenant)
    try:
        return await submit_claim_for_analysis(db, ctx, payload)
    except ClaimAlreadyExistsError as exc:
        raise _error("CLAIM_ALREADY_EXISTS", str(exc), status.HTTP_409_CONFLICT) from exc
    except ValueError as exc:
        raise _error("INVALID_IMAGE", str(exc), status.HTTP_422_UNPROCESSABLE_ENTITY) from exc
    except RuntimeError as exc:
        raise _error("QUEUE_UNAVAILABLE", str(exc), status.HTTP_503_SERVICE_UNAVAILABLE) from exc
