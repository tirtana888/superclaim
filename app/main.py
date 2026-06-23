from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

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
