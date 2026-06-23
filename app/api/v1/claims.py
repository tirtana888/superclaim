from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.claim import ClaimAnalyzeRequest, ClaimAnalyzeResponse, ErrorResponse
from app.security import AuthenticatedContext, get_authenticated_context
from app.services.claim_service import ClaimAlreadyExistsError, submit_claim_for_analysis

router = APIRouter(prefix="/v1/claims", tags=["claims"])


@router.post(
    "/analyze",
    response_model=ClaimAnalyzeResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        401: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def analyze_claim(
    payload: ClaimAnalyzeRequest,
    auth: AuthenticatedContext = Depends(get_authenticated_context),
) -> ClaimAnalyzeResponse:
    try:
        return await submit_claim_for_analysis(auth.db, auth.tenant, payload)
    except ClaimAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CLAIM_ALREADY_EXISTS",
                "message": str(exc),
                "detail": {"claim_id": exc.claim_id},
            },
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_IMAGE",
                "message": str(exc),
                "detail": None,
            },
        ) from exc
    except RuntimeError as exc:
        message = str(exc)
        error_code = (
            "QUEUE_UNAVAILABLE"
            if "enqueue" in message.lower() or "broker" in message.lower()
            else "STORAGE_UNAVAILABLE"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": error_code,
                "message": message,
                "detail": None,
            },
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": str(exc),
                "detail": None,
            },
        ) from exc
