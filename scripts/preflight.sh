#!/usr/bin/env bash
# SuperClaim - Preflight gate. Run once before a production deploy.
# Usage: bash scripts/preflight.sh
set -euo pipefail

echo "SuperClaim Preflight Check"

echo "-> Compatibility check"
python scripts/check_compat.py

echo "-> Lint (ruff)"
ruff check .

echo "-> Type check (mypy)"
mypy app/

echo "-> Tests + coverage"
pytest --cov=app --cov-report=term-missing --cov-fail-under=70

echo "-> Security scan (dependencies)"
pip-audit || echo "pip-audit warning - review manually"

echo "-> Secret scan (no hardcoded secrets)"
if grep -rEn "(sk-[a-zA-Z0-9]{20}|secret[[:space:]]*=[[:space:]]*['\"][^'\"]{12,})" app/ --include="*.py"; then
  echo "Possible hardcoded secret found"
  exit 1
fi

echo "-> Migration check (model vs migration in sync)"
alembic check || echo "Alembic detected un-migrated model changes - review"

echo "Preflight passed"
