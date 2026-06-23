#!/bin/sh
set -e

# Celery in Docker runs as root — suppress SecurityWarning
export C_FORCE_ROOT=true

# Railway sets RAILWAY_SERVICE_NAME per service (e.g. superclaim-worker).
if echo "${RAILWAY_SERVICE_NAME:-}" | grep -qi worker; then
  if [ -z "${REDIS_URL:-}" ] && [ -z "${REDIS_PRIVATE_URL:-}" ]; then
    echo "ERROR: REDIS_URL is not set. Link Redis service in Railway Variables."
    exit 1
  fi
  _scheme=$(printf '%s' "${REDIS_PRIVATE_URL:-$REDIS_URL}" | cut -d: -f1)
  echo "Starting Celery worker (service=${RAILWAY_SERVICE_NAME}, redis=${_scheme}://...)"
  exec celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
fi

if [ "${SUPERCLAIM_ROLE:-}" = "worker" ]; then
  echo "Starting Celery worker (SUPERCLAIM_ROLE=worker)..."
  exec celery -A app.celery_app.celery_app worker --loglevel=info --concurrency=2
fi

PORT="${PORT:-8000}"
echo "Starting API on port ${PORT} (service=${RAILWAY_SERVICE_NAME:-api})..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
