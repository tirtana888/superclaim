import os

from celery import Celery

from app.config import settings

# Broken CELERY_* env vars on Railway can override broker/backend (e.g. typo → ModuleNotFoundError: reseau)
for _key in ("CELERY_RESULT_BACKEND", "CELERY_BROKER_URL"):
    _val = os.environ.get(_key, "").strip()
    if _val and not _val.startswith(("redis://", "rediss://")):
        os.environ.pop(_key, None)

_redis_url = settings.celery_redis_url

celery_app = Celery("superclaim")
celery_app.conf.broker_url = _redis_url
celery_app.conf.result_backend = _redis_url

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    imports=("app.tasks.claim_tasks",),
    broker_connection_retry_on_startup=True,
)


@celery_app.task(name="superclaim.health_check")
def health_check() -> str:
    return "ok"
