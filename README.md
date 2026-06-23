# SuperClaim.ai

B2B AI-powered warranty claims processing engine for electronics and gadgets.

## Stack (Session 1–2)

- **FastAPI** — API engine
- **Supabase** — PostgreSQL + Storage (managed)
- **SQLAlchemy 2.0 async** + **Alembic** — ORM & migrations
- **Celery + Redis** — async task queue
- **API Key auth** — `X-API-Key` + `X-Tenant-ID` headers

## Claim intake (Session 2)

```bash
POST /v1/claims/analyze
Headers: X-API-Key, X-Tenant-ID
```

Accepts claim metadata + base64 images, uploads to Supabase Storage (`{tenant_id}/{claim_id}/{filename}`), saves claim with status `processing`, and enqueues a Celery job.

Returns `202 Accepted` with `claim_id`, `internal_id`, `status`, `image_count`, `submitted_at`.

## Vision (Session 3)

Damage detection and device identification via **Google Gemini** (`gemini-3.5-flash` by default).

Set `GEMINI_API_KEY` in `.env`. Optional: override model with `GEMINI_VISION_MODEL`.

```python
from app.services.vision_service import analyze_claim_image

result = await analyze_claim_image(signed_url, device_category="smartphone")
# result.damage_type, result.damage_severity, result.confidence, result.ai_cost_usd
```

## OCR (Session 4)

Serial number extraction via **Mistral Document AI** (`mistral-ocr-latest`).

Set `MISTRAL_API_KEY` in `.env`. Optional: override model with `MISTRAL_OCR_MODEL`.

```python
from app.services.ocr_service import extract_serial_from_image

result = await extract_serial_from_image(
    image_url=signed_url,
    serial_number_input="SN123456",
)
# result.serial_numbers_found, result.best_match, result.match_with_input, result.ai_cost_usd
```

## Duplicate + EXIF (Session 5)

Perceptual hash duplicate detection (pHash + dHash) and EXIF fraud signals.

```python
from app.services.duplicate_service import analyze_duplicates_and_exif

result = await analyze_duplicates_and_exif(
    db,
    tenant_id=tenant_id,
    claim_id=claim.id,
    images=[(image_bytes, storage_path)],
    claim_date=claim.claim_date,
)
# result.is_duplicate, result.similar_claim_ids, result.exif_flags, result.duplicate_score
```

## Policy engine (Session 6)

Deterministic rules only — **no AI/LLM** for policy decisions.

Rules: `warranty_active`, `device_covered`, `damage_covered`, `claim_limit`, `cooling_period`.

Policy config stored in Supabase `policies` table (per tenant, versioned). Every rule fired is logged to `claim_policy_logs`.

```python
from app.services.policy_engine import evaluate_policy

result = await evaluate_policy(
    db,
    tenant_id=tenant_id,
    claim_id=claim.id,
    external_policy_id="POL-001",
    device_category="smartphone",
    damage_description="Cracked screen",
    purchase_date=claim.purchase_date,
    claim_date=claim.claim_date,
    serial_number=claim.serial_number_input,
)
# result.covered, result.rule_fired, result.rules
```

## Fraud scoring (Session 7)

LightGBM inference with rule-based fallback when model file is missing.

Features: `days_since_purchase`, claim counts (30d/90d/all), `serial_claim_count`, `damage_desc_length`, EXIF signals, `duplicate_score`, `vision_confidence`, `ocr_match`.

```python
from app.services.fraud_service import score_fraud

result = await score_fraud(
    db,
    tenant_id=tenant_id,
    claim_id=claim.id,
    purchase_date=claim.purchase_date,
    claim_date=claim.claim_date,
    damage_description=claim.damage_description,
    serial_number=claim.serial_number_input,
    metadata=claim.metadata_,
    duplicate_result=duplicate_result,
    vision_result=vision_result,
    ocr_result=ocr_result,
)
# result.fraud_score, result.risk_level, result.feature_contributions
```

Place trained model at `models/fraud_lgbm.txt` or set `FRAUD_MODEL_PATH` in `.env`.

## Decision orchestration (Session 8)

Celery task `superclaim.process_claim` runs the full pipeline:

1. Duplicate + EXIF
2. Gemini vision
3. Mistral OCR
4. Policy engine
5. Fraud scoring
6. Decision: **APPROVE / REJECT / REVIEW**

Fetch completed result:

```bash
GET /v1/claims/{claim_id}
Headers: X-API-Key, X-Tenant-ID
```

Decision logic:
- **REJECT** — policy not covered, duplicate score > 0.95, or fraud > 0.85
- **APPROVE** — all rules pass, fraud < 0.30, vision confidence > 0.80
- **REVIEW** — everything else

## Quick start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Fill in Supabase credentials in `.env`:

| Variable | Where to find it |
|----------|------------------|
| `SUPABASE_URL` | Project Settings → API |
| `SUPABASE_ANON_KEY` | Project Settings → API (anon/public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (service_role — **backend only**) |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string (URI, async: replace `postgresql://` with `postgresql+asyncpg://`) |

Example DB URL (region ap-south-1):

```
postgresql+asyncpg://postgres:[PASSWORD]@db.rlszvadiebttvguupegp.supabase.co:5432/postgres
```

3. Seed a dev tenant:

```bash
python scripts/seed_tenant.py
```

Uses API key `sc_globalbeli_dev_2026` (matches `SECRET_KEY` in `.env`).

4. Run migrations (if not applied via Supabase MCP):

```bash
pip install -r requirements.txt
alembic upgrade head
```

4. Start services:

```bash
docker compose up --build
```

5. Health check:

```bash
curl http://localhost:8000/health
```

## Project structure

```
app/
├── config.py          # pydantic-settings
├── database.py        # async SQLAlchemy engine + session
├── security.py        # API key + tenant auth
├── models/            # Tenant, Claim (multi-tenant)
├── storage/           # Supabase Storage client
├── celery_app.py      # Celery worker config
└── main.py            # FastAPI entrypoint
```

## Architecture notes

- Supabase is treated as **plain Postgres** for the engine — multi-tenant logic lives in FastAPI, not RLS.
- Storage bucket `claim-media` must be **private**; use signed URLs for AI APIs (Session 2+).
- Postgres runs on Supabase — no local Postgres container in docker-compose.

## Session roadmap

| Session | Focus |
|---------|-------|
| 1 | Foundation + Supabase (this) |
| 2 | Storage + claim intake endpoint |
| 3 | Vision (Gemini 3.5 Flash) |
| 4 | OCR (Mistral Document AI) |
| 5 | Duplicate + EXIF |
| 6 | Policy engine |
| 7 | Fraud scoring (LightGBM) |
| 8 | Decision orchestration + Celery pipeline |
| 9 | Next.js dashboard |

## Dashboard (Session 9)

Next.js 14 dashboard in `dashboard/` — dark mode, stats cards, claims list, claim detail with vision/OCR/policy/fraud results. Polls every 3 seconds.

```bash
cd dashboard
cp .env.local.example .env.local   # fill Supabase service role + tenant
npm install
npm run dev
```

Open http://localhost:3000

**Note:** Dashboard API routes use `SUPABASE_SERVICE_ROLE_KEY` server-side only (never expose to browser). Claim submission still goes through FastAPI engine at `SUPERCLAIM_API_URL`.
