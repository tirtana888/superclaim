from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.v1.claim_results import router as claim_results_router
from app.api.v1.claims import router as claims_router
from app.celery_app import celery_app
from app.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.app_env)
    yield


app = FastAPI(
    title="SuperClaim.ai",
    description="B2B AI-powered warranty claims processing engine",
    version=settings.app_version,
    lifespan=lifespan,
)

app.include_router(claims_router)
app.include_router(claim_results_router)


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
