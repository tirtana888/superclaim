from typing import Any

from pydantic import BaseModel, Field


class FraudAnalysisResult(BaseModel):
    fraud_score: float = Field(ge=0.0, le=1.0)
    risk_level: str
    feature_contributions: dict[str, float] = Field(default_factory=dict)
    model_source: str
    features: dict[str, float | int | bool] = Field(default_factory=dict)


class FraudFeatureVector(BaseModel):
    days_since_purchase: float = 0.0
    user_claim_count_30d: int = 0
    user_claim_count_90d: int = 0
    user_claim_count_all: int = 0
    serial_claim_count: int = 0
    damage_desc_length: int = 0
    has_exif: float = 0.0
    exif_date_matches_claim: float = 1.0
    duplicate_score: float = 0.0
    vision_confidence: float = 0.0
    ocr_match: float = 0.0

    def as_list(self) -> list[float]:
        return [
            float(self.days_since_purchase),
            float(self.user_claim_count_30d),
            float(self.user_claim_count_90d),
            float(self.user_claim_count_all),
            float(self.serial_claim_count),
            float(self.damage_desc_length),
            float(self.has_exif),
            float(self.exif_date_matches_claim),
            float(self.duplicate_score),
            float(self.vision_confidence),
            float(self.ocr_match),
        ]

    def as_dict(self) -> dict[str, float | int]:
        return self.model_dump()
