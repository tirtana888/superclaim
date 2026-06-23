import io
import logging
from datetime import date, datetime
from uuid import UUID

import imagehash
from PIL import ExifTags, Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.claim_image_hash import ClaimImageHash
from app.schemas.duplicate import DuplicateAnalysisResult, ExifFlag

logger = logging.getLogger(__name__)

HAMMING_THRESHOLD = 10
EDITING_SOFTWARE_KEYWORDS = (
    "photoshop",
    "adobe",
    "gimp",
    "lightroom",
    "snapseed",
    "picsart",
    "canva",
    "affinity",
    "pixelmator",
)


def compute_image_hashes(image_bytes: bytes) -> tuple[str, str]:
    image = Image.open(io.BytesIO(image_bytes))
    phash = str(imagehash.phash(image))
    dhash = str(imagehash.dhash(image))
    return phash, dhash


def hamming_distance(hash_a: str, hash_b: str) -> int:
    return imagehash.hex_to_hash(hash_a) - imagehash.hex_to_hash(hash_b)


def extract_exif(image_bytes: bytes) -> dict[str, str | float | None]:
    image = Image.open(io.BytesIO(image_bytes))
    raw_exif = image.getexif()
    if not raw_exif:
        return {}

    parsed: dict[str, str | float | None] = {}
    for tag_id, value in raw_exif.items():
        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
        if tag_name in {"DateTimeOriginal", "DateTime", "Software", "Make", "Model"}:
            parsed[tag_name] = str(value) if value is not None else None

    gps_info = raw_exif.get_ifd(0x8825)
    if gps_info:
        gps_raw = {
            ExifTags.GPSTAGS.get(key, str(key)): str(value)
            for key, value in gps_info.items()
        }
        parsed["gps"] = gps_raw  # type: ignore[assignment]

    return parsed


def _parse_exif_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def analyze_exif_flags(
    exif: dict[str, str | float | None],
    claim_date: date | None,
) -> list[ExifFlag]:
    flags: list[ExifFlag] = []

    if not exif:
        flags.append(
            ExifFlag(
                code="EXIF_MISSING",
                description="No EXIF metadata found in image",
                severity="low",
            )
        )
        return flags

    date_taken_raw = exif.get("DateTimeOriginal") or exif.get("DateTime")
    if isinstance(date_taken_raw, str):
        date_taken = _parse_exif_datetime(date_taken_raw)
        if date_taken and claim_date and date_taken.date() > claim_date:
            flags.append(
                ExifFlag(
                    code="EXIF_DATE_AFTER_CLAIM",
                    description=(
                        f"Photo taken on {date_taken.date()} is after claim date {claim_date}"
                    ),
                    severity="high",
                )
            )

    software = exif.get("Software")
    if isinstance(software, str):
        software_lower = software.lower()
        if any(keyword in software_lower for keyword in EDITING_SOFTWARE_KEYWORDS):
            flags.append(
                ExifFlag(
                    code="EDITING_SOFTWARE_DETECTED",
                    description=f"Image editing software detected: {software}",
                    severity="medium",
                )
            )

    return flags


async def _find_similar_claims(
    db: AsyncSession,
    tenant_id: UUID,
    phash: str,
    dhash: str,
    exclude_claim_id: UUID,
) -> tuple[list[str], float]:
    result = await db.execute(
        select(ClaimImageHash, Claim.external_claim_id).join(
            Claim,
            ClaimImageHash.claim_id == Claim.id,
        ).where(
            ClaimImageHash.tenant_id == tenant_id,
            ClaimImageHash.claim_id != exclude_claim_id,
        )
    )

    similar_ids: list[str] = []
    best_distance = 64

    for row in result.all():
        image_hash, external_claim_id = row
        phash_distance = hamming_distance(phash, image_hash.phash)
        dhash_distance = hamming_distance(dhash, image_hash.dhash)
        min_distance = min(phash_distance, dhash_distance)

        if min_distance <= HAMMING_THRESHOLD and external_claim_id not in similar_ids:
            similar_ids.append(external_claim_id)
            best_distance = min(best_distance, min_distance)

    duplicate_score = 0.0
    if best_distance < 64:
        duplicate_score = round(max(0.0, 1.0 - (best_distance / 64)), 4)

    return similar_ids, duplicate_score


async def analyze_duplicates_and_exif(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    claim_id: UUID,
    images: list[tuple[bytes, str]],
    claim_date: date | None,
) -> DuplicateAnalysisResult:
    """Compute hashes, detect duplicates, and extract EXIF flags for claim images."""
    all_similar_ids: list[str] = []
    max_duplicate_score = 0.0
    all_exif_flags: list[ExifFlag] = []
    merged_exif: dict[str, str | float | None] = {}

    for index, (image_bytes, storage_path) in enumerate(images):
        phash, dhash = compute_image_hashes(image_bytes)
        db.add(
            ClaimImageHash(
                tenant_id=tenant_id,
                claim_id=claim_id,
                storage_path=storage_path,
                phash=phash,
                dhash=dhash,
                image_index=index,
            )
        )

        similar_ids, duplicate_score = await _find_similar_claims(
            db,
            tenant_id,
            phash,
            dhash,
            exclude_claim_id=claim_id,
        )
        for claim_ref in similar_ids:
            if claim_ref not in all_similar_ids:
                all_similar_ids.append(claim_ref)
        max_duplicate_score = max(max_duplicate_score, duplicate_score)

        exif = extract_exif(image_bytes)
        merged_exif.update({f"image_{index}": exif})
        all_exif_flags.extend(analyze_exif_flags(exif, claim_date))

    await db.flush()

    is_duplicate = len(all_similar_ids) > 0
    logger.info(
        "Duplicate analysis claim_id=%s duplicate=%s similar=%s score=%.4f",
        claim_id,
        is_duplicate,
        all_similar_ids,
        max_duplicate_score,
    )

    return DuplicateAnalysisResult(
        is_duplicate=is_duplicate,
        similar_claim_ids=all_similar_ids,
        exif_flags=all_exif_flags,
        duplicate_score=max_duplicate_score,
        exif_data=merged_exif,
    )
