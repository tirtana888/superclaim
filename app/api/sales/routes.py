"""Sales rep API (internal SuperClaim staff) — dealer onboarding, revenue, commission."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_sales_rep
from app.database import get_db
from app.models.sales_rep import SalesRep
from app.schemas.sales import (
    CommissionSummaryOut,
    DealerDetailOut,
    DealerOnboardCreated,
    DealerOnboardRequest,
    DealerOut,
)
from app.services import sales_service

router = APIRouter(prefix="/api/sales", tags=["sales"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.post("/dealers", response_model=DealerOnboardCreated, status_code=status.HTTP_201_CREATED)
async def onboard_dealer(
    payload: DealerOnboardRequest,
    sales_rep: SalesRep = Depends(require_sales_rep),
    db: AsyncSession = Depends(get_db),
) -> DealerOnboardCreated:
    try:
        return await sales_service.onboard_dealer(db, sales_rep=sales_rep, payload=payload)
    except sales_service.DealerConflictError as exc:
        raise _error("DEALER_CONFLICT", str(exc), status.HTTP_409_CONFLICT) from exc


@router.get("/dealers", response_model=dict[str, list[DealerOut]])
async def list_dealers(
    sales_rep: SalesRep = Depends(require_sales_rep),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[DealerOut]]:
    dealers = await sales_service.list_dealers(db, sales_rep.id)
    return {"dealers": dealers}


@router.get("/dealers/{tenant_id}", response_model=DealerDetailOut)
async def get_dealer(
    tenant_id: UUID,
    sales_rep: SalesRep = Depends(require_sales_rep),
    db: AsyncSession = Depends(get_db),
) -> DealerDetailOut:
    try:
        return await sales_service.get_dealer_detail(db, sales_rep_id=sales_rep.id, tenant_id=tenant_id)
    except sales_service.DealerNotFoundError as exc:
        raise _error("DEALER_NOT_FOUND", str(exc), status.HTTP_404_NOT_FOUND) from exc


@router.get("/commission", response_model=CommissionSummaryOut)
async def get_commission(
    range: Literal["week", "month"] = Query(default="month"),
    sales_rep: SalesRep = Depends(require_sales_rep),
    db: AsyncSession = Depends(get_db),
) -> CommissionSummaryOut:
    return await sales_service.compute_commission(db, sales_rep=sales_rep, range_=range)
