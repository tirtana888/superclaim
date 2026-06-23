"""Control Plane usage billing endpoints (JWT)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant, get_current_user, require_role
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.control import UsageRecordOut
from app.services import usage_service

router = APIRouter(prefix="/api/usage", tags=["usage"])


def _error(code: str, message: str, http_status: int) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"error_code": code, "message": message, "detail": None},
    )


@router.get("/current", response_model=UsageRecordOut)
async def get_current_usage(
    user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> UsageRecordOut:
    try:
        record = await usage_service.get_usage(db, tenant.id)
    except usage_service.UsageNotFoundError:
        record = await usage_service.record_claim_processed(
            db, tenant_id=tenant.id, ai_cost_usd=0.0
        )
        await db.commit()
        await db.refresh(record)
    return usage_service.usage_to_out(record)


@router.get("", response_model=list[UsageRecordOut])
async def list_usage(
    limit: int = Query(default=12, ge=1, le=36),
    user: User = Depends(require_role("owner", "admin")),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> list[UsageRecordOut]:
    records = await usage_service.list_usage(db, tenant.id, limit=limit)
    return [usage_service.usage_to_out(r) for r in records]
