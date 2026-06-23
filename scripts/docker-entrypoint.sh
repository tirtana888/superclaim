#!/bin/sh
set -e

# Railway sets RAILWAY_SERVICE_NAME per service (e.g. superclaim-worker).
if echo "${RAILWAY_SERVICE_NAME:-}" | grep -qi worker; then
  echo "Starting Celery worker (service=${RAILWAY_SERVICE_NAME})..."
  exec celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
fi

if [ "${SUPERCLAIM_ROLE:-}" = "worker" ]; then
  echo "Starting Celery worker (SUPERCLAIM_ROLE=worker)..."
  exec celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
fi

PORT="${PORT:-8000}"
echo "Starting API on port ${PORT} (service=${RAILWAY_SERVICE_NAME:-api})..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
