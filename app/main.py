from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.admin import admin_router
from app.api.control import (
    auth_router,
    claims_control_router,
    credentials_router,
    devices_router,
    policies_router,
    team_router,
    usage_router,
)
from app.api.v1.claim_results import router as claim_results_router
from app.api.v1.claims import router as claims_router
from app.celery_app import celery_app
from app.config import settings
from app.database import check_db_health
from app.services.bootstrap_service import ensure_superadmin
from app.storage.supabase_client import check_storage_health


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.app_env)
    from app.database import get_session_factory

    async with get_session_factory()() as db:
        await ensure_superadmin(db)
    yield


app = FastAPI(
    title="SuperClaim.ai",
    description="B2B AI-powered warranty claims processing engine",
    version=settings.app_version,
    lifespan=lifespan,
)

app.include_router(claims_router)
app.include_router(claim_results_router)
app.include_router(auth_router)
app.include_router(policies_router)
app.include_router(devices_router)
app.include_router(credentials_router)
app.include_router(team_router)
app.include_router(claims_control_router)
app.include_router(usage_router)
app.include_router(admin_router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": {"error_code": "HTTP_ERROR", "message": str(exc.detail), "detail": None}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "detail": {
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid request payload",
                "detail": exc.errors(),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "detail": {
                "error_code": "INTERNAL_ERROR",
                "message": str(exc),
                "detail": None,
            }
        },
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@app.get("/health/celery")
async def celery_health() -> JSONResponse:
    try:
        result = celery_app.send_task("superclaim.health_check")
        worker_response = result.get(timeout=5)
        return JSONResponse({"status": "ok", "celery": worker_response})
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "error_code": "CELERY_UNAVAILABLE",
                "message": str(exc),
            },
        )


@app.get("/health/storage")
async def storage_health() -> JSONResponse:
    try:
        await check_storage_health()
        return JSONResponse({"status": "ok", "storage": "ok"})
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "error_code": "STORAGE_UNAVAILABLE",
                "message": str(exc),
            },
        )


@app.get("/health/db")
async def db_health() -> JSONResponse:
    try:
        await check_db_health()
        return JSONResponse({"status": "ok", "db": "ok"})
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "error_code": "DB_UNAVAILABLE",
                "message": str(exc),
            },
        )
