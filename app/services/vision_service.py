import asyncio
import json
import logging
from typing import Any

import httpx
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.vision import VisionAnalysisResult

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 1.0

# Approximate Gemini 3.5 Flash pricing (USD per token) — update when billing changes.
INPUT_COST_PER_TOKEN = 0.15 / 1_000_000
OUTPUT_COST_PER_TOKEN = 0.60 / 1_000_000

VISION_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "damage_type": {"type": "string"},
        "damage_severity": {
            "type": "string",
            "enum": ["none", "minor", "moderate", "severe"],
        },
        "device_identified": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": [
        "damage_type",
        "damage_severity",
        "device_identified",
        "confidence",
    ],
}

VISION_PROMPT = """You are an expert warranty claims assessor for consumer electronics.

Analyze the claim photo for device category: {device_category}.

Return JSON with:
- damage_type: short label (e.g. cracked_screen, water_damage, no_visible_damage)
- damage_severity: one of none, minor, moderate, severe
- device_identified: brand/model if visible, else best guess from category
- confidence: 0.0-1.0 for your overall assessment
"""


def _get_client() -> genai.Client:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    return genai.Client(api_key=settings.gemini_api_key)


def _estimate_cost_usd(usage: Any) -> float:
    if usage is None:
        return 0.0
    input_tokens = getattr(usage, "prompt_token_count", 0) or 0
    output_tokens = getattr(usage, "candidates_token_count", 0) or 0
    return round(
        input_tokens * INPUT_COST_PER_TOKEN + output_tokens * OUTPUT_COST_PER_TOKEN,
        6,
    )


async def _fetch_image(image_url: str) -> tuple[bytes, str]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(image_url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/jpeg").split(";")[0]
        return response.content, content_type or "image/jpeg"


def _call_gemini(
    image_bytes: bytes,
    mime_type: str,
    device_category: str,
) -> tuple[dict[str, Any], float, dict[str, Any]]:
    client = _get_client()
    prompt = VISION_PROMPT.format(device_category=device_category)
    response = client.models.generate_content(
        model=settings.gemini_vision_model,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=VISION_RESPONSE_SCHEMA,
            temperature=0.2,
        ),
    )
    parsed = json.loads(response.text or "{}")
    cost = _estimate_cost_usd(response.usage_metadata)
    raw = {
        "model": settings.gemini_vision_model,
        "text": response.text,
        "usage": {
            "prompt_token_count": getattr(response.usage_metadata, "prompt_token_count", None),
            "candidates_token_count": getattr(
                response.usage_metadata, "candidates_token_count", None
            ),
        },
    }
    return parsed, cost, raw


async def analyze_claim_image(
    device_category: str,
    *,
    image_url: str | None = None,
    image_bytes: bytes | None = None,
    content_type: str = "image/jpeg",
) -> VisionAnalysisResult:
    """Analyze a claim image using Gemini vision."""
    if image_bytes is not None:
        mime_type = content_type.split(";")[0] or "image/jpeg"
        payload = image_bytes
    elif image_url:
        payload, mime_type = await _fetch_image(image_url)
    else:
        raise ValueError("Either image_url or image_bytes is required")

    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            parsed, cost, raw = await asyncio.to_thread(
                _call_gemini,
                payload,
                mime_type,
                device_category,
            )
            logger.info(
                "Gemini vision success model=%s cost_usd=%.6f attempt=%d",
                settings.gemini_vision_model,
                cost,
                attempt,
            )
            return VisionAnalysisResult(
                damage_type=parsed.get("damage_type", "unknown"),
                damage_severity=parsed.get("damage_severity", "none"),
                device_identified=parsed.get("device_identified", "unknown"),
                confidence=float(parsed.get("confidence", 0.0)),
                ai_cost_usd=cost,
                raw_response=raw,
            )
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Gemini vision attempt %d/%d failed: %s",
                attempt,
                MAX_RETRIES,
                exc,
            )
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

    raise RuntimeError(f"Gemini vision failed after {MAX_RETRIES} attempts") from last_error
