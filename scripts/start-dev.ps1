# SuperClaim local dev (no Docker) — Windows PowerShell
# Requires: Python 3.11+, Redis running on localhost:6379

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== SuperClaim dev startup ===" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env not found. Copy from README setup first." -ForegroundColor Red
    exit 1
}

$python = "python"
try {
    & $python -c "import fastapi" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "missing" }
} catch {
    Write-Host "Installing minimal dependencies (requirements-minimal.txt)..." -ForegroundColor Yellow
    & $python -m pip install -r requirements-minimal.txt
}

Write-Host ""
Write-Host "Start these in SEPARATE terminals:" -ForegroundColor Green
Write-Host ""
Write-Host "  Terminal 1 — API (port 8000):" -ForegroundColor White
Write-Host "    cd $PWD"
Write-Host "    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Write-Host ""
Write-Host "  Terminal 2 — Celery worker (needs Redis on :6379):" -ForegroundColor White
Write-Host "    cd $PWD"
Write-Host "    celery -A app.celery_app.celery_app worker --loglevel=info --pool=solo"
Write-Host ""
Write-Host "  Terminal 3 — Dashboard:" -ForegroundColor White
Write-Host "    cd $PWD\dashboard"
Write-Host "    npm run dev"
Write-Host ""
Write-Host "Health: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "Trial UI: http://localhost:3000/submit" -ForegroundColor Cyan
Write-Host ""
Write-Host "Redis without Docker: install Memurai (Windows) or use WSL + redis-server" -ForegroundColor Yellow
