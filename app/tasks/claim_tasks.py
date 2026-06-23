"""Celery tasks for claim processing."""

import logging

from app.celery_app import celery_app
from app.services.claim_pipeline import run_claim_analysis_sync

logger = logging.getLogger(__name__)


@celery_app.task(name="superclaim.process_claim", bind=True, max_retries=2)
def process_claim_task(self, claim_id: str) -> dict:
    """Run vision, OCR, duplicate, policy, fraud, and decision pipeline."""
    try:
        return run_claim_analysis_sync(claim_id)
    except Exception as exc:
        logger.exception("Claim processing failed for %s", claim_id)
        raise self.retry(exc=exc, countdown=5 * (self.request.retries + 1)) from exc
