import logging
from datetime import UTC, date, datetime, timedelta
from functools import lru_cache
from pathlib import Path
from uuid import UUID

import lightgbm as lgb
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.claim import Claim
from app.schemas.duplicate import DuplicateAnalysisResult
from app.schemas.fraud import FraudAnalysisResult, FraudFeatureVector
from app.schemas.ocr import OcrAnalysisResult
from app.schemas.vision import VisionAnalysisResult

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "days_since_purchase",
    "user_claim_count_30d",
    "user_claim_count_90d",
    "user_claim_count_all",
    "serial_claim_count",
    "damage_desc_length",
    "has_exif",
    "exif_date_matches_claim",
    "duplicate_score",
    "vision_confidence",
    "ocr_match",
]

RISK_LEVELS = (
    (0.85, "critical"),
    (0.65, "high"),
    (0.40, "medium"),
    (0.0, "low"),
)


def _risk_level(score: float) -> str:
    for threshold, label in RISK_LEVELS:
        if score >= threshold:
            return label
    return "low"


def _has_exif_data(duplicate_result: DuplicateAnalysisResult) -> bool:
    for value in duplicate_result.exif_data.values():
        if isinstance(value, dict) and value:
            return True
    return False


def _exif_date_matches_claim(duplicate_result: DuplicateAnalysisResult) -> float:
    flagged_codes = {flag.code for flag in duplicate_result.exif_flags}
    if "EXIF_MISSING" in flagged_codes:
        return 0.5
    if "EXIF_DATE_AFTER_CLAIM" in flagged_codes:
        return 0.0
    return 1.0


def _ocr_match_score(ocr_result: OcrAnalysisResult | None) -> float:
    if ocr_result is None:
        return 0.5
    if ocr_result.match_with_input is True:
        return 1.0
    if ocr_result.match_with_input is False:
        return 0.0
    return float(ocr_result.confidence)


async def _count_claims(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    exclude_claim_id: UUID,
    since: datetime | None = None,
    user_id: str | None = None,
    serial_number: str | None = None,
) -> int:
    query = select(func.count()).select_from(Claim).where(
        Claim.tenant_id == tenant_id,
        Claim.id != exclude_claim_id,
    )
    if since is not None:
        query = query.where(Claim.created_at >= since)
    if user_id is not None:
        query = query.where(Claim.metadata_["user_id"].astext == user_id)
    if serial_number is not None:
        query = query.where(Claim.serial_number_input == serial_number)

    result = await db.execute(query)
    return int(result.scalar_one())


async def build_feature_vector(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    claim_id: UUID,
    purchase_date: date | None,
    claim_date: date | None,
    damage_description: str | None,
    serial_number: str | None,
    metadata: dict,
    duplicate_result: DuplicateAnalysisResult,
    vision_result: VisionAnalysisResult | None,
    ocr_result: OcrAnalysisResult | None,
) -> FraudFeatureVector:
    now = datetime.now(UTC)
    user_id = metadata.get("user_id")
    user_id_str = str(user_id) if user_id is not None else None

    days_since_purchase = 0.0
    if purchase_date and claim_date:
        days_since_purchase = float(max((claim_date - purchase_date).days, 0))

    serial_claim_count = 0
    if serial_number:
        serial_claim_count = await _count_claims(
            db,
            tenant_id=tenant_id,
            exclude_claim_id=claim_id,
            serial_number=str(serial_number),
        )

    user_claim_count_30d = 0
    user_claim_count_90d = 0
    user_claim_count_all = 0
    if user_id_str:
        user_claim_count_30d = await _count_claims(
            db,
            tenant_id=tenant_id,
            exclude_claim_id=claim_id,
            since=now - timedelta(days=30),
            user_id=user_id_str,
        )
        user_claim_count_90d = await _count_claims(
            db,
            tenant_id=tenant_id,
            exclude_claim_id=claim_id,
            since=now - timedelta(days=90),
            user_id=user_id_str,
        )
        user_claim_count_all = await _count_claims(
            db,
            tenant_id=tenant_id,
            exclude_claim_id=claim_id,
            user_id=user_id_str,
        )

    return FraudFeatureVector(
        days_since_purchase=days_since_purchase,
        user_claim_count_30d=user_claim_count_30d,
        user_claim_count_90d=user_claim_count_90d,
        user_claim_count_all=user_claim_count_all,
        serial_claim_count=serial_claim_count,
        damage_desc_length=len(damage_description or ""),
        has_exif=1.0 if _has_exif_data(duplicate_result) else 0.0,
        exif_date_matches_claim=_exif_date_matches_claim(duplicate_result),
        duplicate_score=duplicate_result.duplicate_score,
        vision_confidence=vision_result.confidence if vision_result else 0.0,
        ocr_match=_ocr_match_score(ocr_result),
    )


@lru_cache
def _load_model(model_path: str) -> lgb.Booster | None:
    path = Path(model_path)
    if not path.exists():
        return None
    try:
        return lgb.Booster(model_file=str(path))
    except Exception as exc:
        logger.warning("Failed to load fraud model from %s: %s", path, exc)
        return None


def _rule_based_score(features: FraudFeatureVector) -> tuple[float, dict[str, float]]:
    contributions = {
        "duplicate_score": features.duplicate_score * 0.35,
        "ocr_match": (1.0 - features.ocr_match) * 0.20,
        "exif_date_matches_claim": (1.0 - features.exif_date_matches_claim) * 0.15,
        "user_claim_count_90d": min(features.user_claim_count_90d / 5.0, 1.0) * 0.15,
        "serial_claim_count": min(features.serial_claim_count / 3.0, 1.0) * 0.10,
        "vision_confidence": (1.0 - features.vision_confidence) * 0.05,
    }
    score = min(sum(contributions.values()), 1.0)
    return score, contributions


def _model_score(
    model: lgb.Booster,
    features: FraudFeatureVector,
) -> tuple[float, dict[str, float]]:
    vector = features.as_list()
    raw = float(model.predict([vector])[0])
    score = max(0.0, min(raw, 1.0))

    contributions: dict[str, float] = {}
    try:
        importances = model.feature_importance(importance_type="gain")
        total = float(sum(importances)) or 1.0
        for name, importance in zip(FEATURE_NAMES, importances, strict=False):
            contributions[name] = round((importance / total) * score, 4)
    except Exception:
        equal = score / len(FEATURE_NAMES)
        contributions = {name: round(equal, 4) for name in FEATURE_NAMES}

    return score, contributions


async def score_fraud(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    claim_id: UUID,
    purchase_date: date | None,
    claim_date: date | None,
    damage_description: str | None,
    serial_number: str | None,
    metadata: dict,
    duplicate_result: DuplicateAnalysisResult,
    vision_result: VisionAnalysisResult | None = None,
    ocr_result: OcrAnalysisResult | None = None,
) -> FraudAnalysisResult:
    """Score fraud risk using LightGBM if model exists, else rule-based fallback."""
    features = await build_feature_vector(
        db,
        tenant_id=tenant_id,
        claim_id=claim_id,
        purchase_date=purchase_date,
        claim_date=claim_date,
        damage_description=damage_description,
        serial_number=serial_number,
        metadata=metadata,
        duplicate_result=duplicate_result,
        vision_result=vision_result,
        ocr_result=ocr_result,
    )

    model = _load_model(settings.fraud_model_path) if settings.fraud_model_path else None
    if model is not None:
        fraud_score, contributions = _model_score(model, features)
        model_source = "lightgbm"
    else:
        fraud_score, contributions = _rule_based_score(features)
        model_source = "rule_based_fallback"

    logger.info(
        "Fraud score claim_id=%s score=%.4f source=%s risk=%s",
        claim_id,
        fraud_score,
        model_source,
        _risk_level(fraud_score),
    )

    return FraudAnalysisResult(
        fraud_score=round(fraud_score, 4),
        risk_level=_risk_level(fraud_score),
        feature_contributions=contributions,
        model_source=model_source,
        features=features.as_dict(),
    )


async def score(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    claim_id: UUID,
    purchase_date: date | None = None,
    claim_date: date | None = None,
    damage_description: str | None = None,
    serial_number: str | None = None,
    metadata: dict | None = None,
    duplicate_result: DuplicateAnalysisResult | None = None,
    vision_result: VisionAnalysisResult | None = None,
    ocr_result: OcrAnalysisResult | None = None,
) -> "FraudResult":
    """Canonical entrypoint — wraps score_fraud()."""
    from app.schemas.results import FraudResult
    from app.services.result_adapters import to_fraud_result

    legacy = await score_fraud(
        db,
        tenant_id=tenant_id,
        claim_id=claim_id,
        purchase_date=purchase_date,
        claim_date=claim_date,
        damage_description=damage_description,
        serial_number=serial_number,
        metadata=metadata,
        duplicate_result=duplicate_result,
        vision_result=vision_result,
        ocr_result=ocr_result,
    )
    return to_fraud_result(legacy)
