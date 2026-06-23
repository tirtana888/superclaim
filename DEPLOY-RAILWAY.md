# Deploy SuperClaim ke Railway

Lokal di Windows sulit karena butuh Redis (Memurai). Di Railway, Redis + API + Celery worker jalan di cloud — laptop cukup buka dashboard trial.

## Auto-deploy setelah merge PR

1. Hubungkan repo GitHub `tirtana888/superclaim` ke project Railway `steadfast-nature`
2. Set **branch deploy** = `master` (Settings → Source → Branch)
3. Setiap **merge PR ke `master`** → Railway rebuild & redeploy otomatis

**Service config (wajib per service):**

| Service | Config file | Dockerfile | Healthcheck |
|---------|-------------|------------|-------------|
| `superclaim-api` | `railway.toml` | `Dockerfile` | `/health` ON (set di Railway UI) |
| `superclaim-worker` | `railway.worker.toml` | `Dockerfile` (sama) | OFF |

## Arsitektur

```
Browser (trial UI)
    │
    ▼
Dashboard (Railway / Vercel) ──► SuperClaim API (Railway)
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Redis (Railway)   Celery Worker      Supabase
              (queue broker)    (Railway)          (DB + Storage)
```

- **Database & file storage** tetap di Supabase (sudah ada).
- **Redis** dari plugin Railway — tidak perlu install Memurai.
- **2 service** dari repo yang sama: `api` + `worker`.

---

## 1. Push ke GitHub

```bash
cd superclaim
git init   # jika belum
git add .
git commit -m "Prepare Railway deploy"
git remote add origin https://github.com/YOUR_USER/superclaim.git
git push -u origin main
```

Jangan commit file `.env` (sudah di `.gitignore`).

---

## 2. Buat project Railway

1. Buka [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → pilih repo `superclaim`

### Service A — API

- Nama: `superclaim-api`
- Builder: **Dockerfile** (otomatis pakai `Dockerfile` + `railway.toml`)
- **Settings → Networking → Generate Domain** → catat URL, mis. `https://superclaim-api-production.up.railway.app`

### Tambah Redis

1. Di project yang sama: **+ New** → **Database** → **Redis**
2. Railway membuat variable `REDIS_URL`

### Service B — Celery worker

1. **+ New** → **GitHub Repo** → repo yang sama lagi
2. Nama service **harus mengandung `worker`**, mis. `superclaim-worker` (entrypoint auto-detect)
3. **Settings → Config file path**: `railway.worker.toml` (opsional, sama dengan API Dockerfile)
4. **Settings → Deploy → Healthcheck**: **OFF** / kosongkan path
5. **Jangan** generate public domain untuk worker

> Entrypoint `scripts/docker-entrypoint.sh` start Celery jika `RAILWAY_SERVICE_NAME` mengandung `worker`.

### Service A — API (healthcheck)

Setelah deploy, di service **API** saja:
**Settings → Deploy → Healthcheck Path** → `/health`

---

## 3. Environment variables

Set di **kedua service** (`api` + `worker`). Bisa pakai **Shared Variables** di level project.

| Variable | Contoh / sumber |
|----------|-----------------|
| `REDIS_URL` | Reference dari Redis service (`${{Redis.REDIS_URL}}`) |
| `SUPABASE_URL` | dari Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | dari Supabase |
| `SUPABASE_DB_URL` | `postgresql+asyncpg://postgres:...@db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_STORAGE_BUCKET` | `claim-media` |
| `GEMINI_API_KEY` | Google AI Studio |
| `MISTRAL_API_KEY` | Mistral console |
| `SECRET_KEY` | string random panjang (production) |
| `APP_ENV` | `production` |
| `DEBUG` | `false` |

**Hanya service API** (opsional untuk worker tidak perlu):

| Variable | Nilai |
|----------|-------|
| `SENTRY_DSN` | jika pakai Sentry |

### Reference Redis di Railway

Di Variables tab service `api` / `worker`:

```
REDIS_URL=${{Redis.REDIS_URL}}
```

(ganti `Redis` dengan nama service Redis Anda)

---

## 4. Verifikasi API

```bash
curl https://YOUR-API.up.railway.app/health
```

Harus: `{"status":"ok",...}`

Cek Celery:

```bash
curl https://YOUR-API.up.railway.app/health/celery
```

Harus: `{"status":"ok","celery":"ok"}`

---

## 5. Deploy Dashboard (trial UI)

### Opsi A — Railway (satu project)

1. **+ New** → **GitHub Repo** → repo yang sama
2. **Root Directory**: `dashboard`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. Variables:

| Variable | Nilai |
|----------|-------|
| `SUPERCLAIM_API_URL` | `https://YOUR-API.up.railway.app` |
| `SUPERCLAIM_API_KEY` | `sc_globalbeli_dev_2026` (atau key production) |
| `SUPERCLAIM_TENANT_ID` | `e1b52fb2-2fb0-4c4d-b9b3-e46e4edec9d6` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |

6. Generate domain → buka `/submit` untuk trial klaim.

### Opsi B — Vercel (lebih cepat untuk Next.js)

1. Import repo di vercel.com
2. Root Directory: `dashboard`
3. Env sama seperti tabel di atas
4. Deploy

---

## 6. Submit klaim trial (tanpa Globalbeli)

1. Buka dashboard → **Trial Submit** (`/submit`)
2. Upload foto kerusakan + isi form
3. Hasil AI muncul di `/claims/{claim_id}` (~30–60 detik)

Atau langsung ke API:

```bash
curl -X POST https://YOUR-API.up.railway.app/v1/claims/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sc_globalbeli_dev_2026" \
  -H "X-Tenant-ID: e1b52fb2-2fb0-4c4d-b9b3-e46e4edec9d6" \
  -d '{"claim_id":"CLM-001","device_category":"smartphone","images":[{"filename":"a.jpg","content_base64":"...","content_type":"image/jpeg"}]}'
```

---

## Estimasi biaya Railway

| Komponen | Perkiraan |
|----------|-----------|
| API | ~$5/bulan (Hobby) |
| Worker | ~$5/bulan |
| Redis | ~$5/bulan |
| Dashboard | ~$5/bulan atau gratis di Vercel |
| Supabase | free tier / existing plan |

Total awal: **~$15–20/bulan** untuk staging trial.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Worker: `Healthcheck failed` / `/health` unavailable | Pakai `railway.worker.toml` + matikan healthcheck di service worker |
| `/health/celery` 503 | Worker belum jalan atau `REDIS_URL` salah |
| Klaim stuck `processing` | Cek log worker di Railway |
| DB connection error | Pastikan `SUPABASE_DB_URL` pakai `postgresql+asyncpg://` dan password URL-encoded |
| Upload gagal | Cek `SUPABASE_SERVICE_ROLE_KEY` + bucket `claim-media` |

---

## Globalbeli nanti

Globalbeli cukup panggil REST API Railway (`POST /v1/claims/analyze`) dengan API key mereka — tidak perlu Memurai atau engine di server mereka.
