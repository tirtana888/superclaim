import asyncio
import base64
import binascii
import logging
import re
from typing import Any

from mistralai.client import Mistral
from rapidfuzz import fuzz, process

from app.config import settings
from app.schemas.ocr import OcrAnalysisResult

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 1.0
FUZZY_MATCH_THRESHOLD = 85
COST_PER_PAGE_USD = 0.001  # ~1000 pages / $1

SERIAL_LABEL_PATTERN = re.compile(
    r"(?:S/N|SN|Serial(?:\s*(?:No|Number|#))?|IMEI|IMEI2|Serial\s*Number)"
    r"[:#\s]*([A-Z0-9][A-Z0-9\-_/]{5,22}[A-Z0-9])",
    re.IGNORECASE,
)
STANDALONE_SERIAL_PATTERN = re.compile(r"\b([A-HJ-NP-Z0-9]{8,20})\b", re.IGNORECASE)

NOISE_TOKENS = {
    "VALID",
    "DISPLAY",
    "PURCHASE",
    "EXPIRES",
    "MIDNIGHT",
    "PERMIT",
    "TICKET",
    "TOTAL",
    "PAID",
    "SETTING",
    "MACHINES",
}


def _get_client() -> Mistral:
    if not settings.mistral_api_key:
        raise RuntimeError("MISTRAL_API_KEY is not configured")
    return Mistral(api_key=settings.mistral_api_key)


def _normalize_base64(content_base64: str) -> str:
    payload = content_base64.strip()
    if payload.startswith("data:"):
        _, _, payload = payload.partition(",")
    return payload


def _build_document_url(
    *,
    image_url: str | None,
    content_base64: str | None,
    content_type: str,
) -> str:
    if image_url:
        return image_url
    if not content_base64:
        raise ValueError("Either image_url or content_base64 is required")
    payload = _normalize_base64(content_base64)
    try:
        base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Invalid base64 image content") from exc
    return f"data:{content_type};base64,{payload}"


def extract_serial_candidates(text: str) -> list[str]:
    candidates: list[str] = []

    for match in SERIAL_LABEL_PATTERN.finditer(text):
        candidates.append(match.group(1).upper())

    for match in STANDALONE_SERIAL_PATTERN.finditer(text):
        token = match.group(1).upper()
        if token in NOISE_TOKENS:
            continue
        if token.isdigit() and len(token) not in {15, 16, 17}:
            continue
        candidates.append(token)

    seen: set[str] = set()
    unique: list[str] = []
    for candidate in candidates:
        normalized = candidate.strip("-_/")
        if len(normalized) < 6 or normalized in seen:
            continue
        seen.add(normalized)
        unique.append(normalized)
    return unique


def _match_serial(
    serial_number_input: str | None,
    candidates: list[str],
) -> tuple[str | None, bool | None, float]:
    if not candidates:
        return None, None, 0.0
    if not serial_number_input:
        return candidates[0], None, 0.75

    result = process.extractOne(
        serial_number_input.upper(),
        candidates,
        scorer=fuzz.ratio,
    )
    if result is None:
        return candidates[0], False, 0.0

    best_match, score, _ = result
    match_with_input = score >= FUZZY_MATCH_THRESHOLD
    confidence = score / 100.0 if match_with_input else max(score / 100.0, 0.3)
    return best_match, match_with_input, confidence


def _extract_markdown(response: Any) -> str:
    pages = getattr(response, "pages", None) or []
    return "\n".join(getattr(page, "markdown", "") or "" for page in pages)


def _estimate_cost_usd(response: Any) -> float:
    usage = getattr(response, "usage_info", None)
    pages = getattr(usage, "pages_processed", 1) if usage else 1
    return round(max(pages, 1) * COST_PER_PAGE_USD, 6)


def _call_mistral_ocr(document_url: str) -> tuple[str, Any, float]:
    client = _get_client()
    response = client.ocr.process(
        model=settings.mistral_ocr_model,
        document={
            "type": "document_url",
            "document_url": document_url,
        },
    )
    markdown = _extract_markdown(response)
    cost = _estimate_cost_usd(response)
    return markdown, response, cost


async def extract_serial_from_image(
    *,
    image_url: str | None = None,
    content_base64: str | None = None,
    content_type: str = "image/jpeg",
    serial_number_input: str | None = None,
) -> OcrAnalysisResult:
    """Extract serial numbers from a claim image using Mistral OCR."""
    document_url = _build_document_url(
        image_url=image_url,
        content_base64=content_base64,
        content_type=content_type,
    )
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            markdown, response, cost = await asyncio.to_thread(
                _call_mistral_ocr,
                document_url,
            )
            serials = extract_serial_candidates(markdown)
            best_match, match_with_input, confidence = _match_serial(
                serial_number_input,
                serials,
            )
            if not serials:
                confidence = 0.0
            elif serial_number_input is None:
                confidence = 0.75

            logger.info(
                "Mistral OCR success model=%s serials=%d cost_usd=%.6f attempt=%d",
                settings.mistral_ocr_model,
                len(serials),
                cost,
                attempt,
            )
            return OcrAnalysisResult(
                serial_numbers_found=serials,
                best_match=best_match,
                match_with_input=match_with_input,
                confidence=confidence,
                ai_cost_usd=cost,
                raw_response={
                    "model": getattr(response, "model", settings.mistral_ocr_model),
                    "markdown": markdown,
                    "usage": {
                        "pages_processed": getattr(
                            getattr(response, "usage_info", None),
                            "pages_processed",
                            None,
                        ),
                    },
                },
            )
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Mistral OCR attempt %d/%d failed: %s",
                attempt,
                MAX_RETRIES,
                exc,
            )
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

    raise RuntimeError(f"Mistral OCR failed after {MAX_RETRIES} attempts") from last_error


async def extract(
    image_url: str,
    *,
    content_base64: str | None = None,
    content_type: str = "image/jpeg",
    serial_number_input: str | None = None,
) -> "OCRResult":
    """Canonical entrypoint — wraps extract_serial_from_image()."""
    from app.schemas.results import OCRResult
    from app.services.result_adapters import to_ocr_result

    if content_base64:
        legacy = await extract_serial_from_image(
            content_base64=content_base64,
            content_type=content_type,
            serial_number_input=serial_number_input,
        )
    else:
        legacy = await extract_serial_from_image(
            image_url=image_url,
            serial_number_input=serial_number_input,
        )
    return to_ocr_result(legacy)
