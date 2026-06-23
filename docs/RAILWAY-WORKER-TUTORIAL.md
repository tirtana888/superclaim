# Tutorial: Setup SuperClaim Worker di Railway

Panduan ini khusus untuk service **Celery worker** — proses background yang menjalankan AI pipeline (Gemini, OCR, policy, fraud) setelah klaim di-submit.

> **Prasyarat:** Project Railway sudah punya **Redis** dan service **API** (`superclaim-api`). Worker tidak bisa jalan tanpa Redis.

---

## Apa itu worker?

```
User submit klaim → API (terima & simpan) → Redis (antrian) → Worker (proses AI) → Supabase (hasil)
```

| Service | Fungsi | Butuh URL publik? |
|---------|--------|-------------------|
| API | Terima request HTTP | ✅ Ya |
| **Worker** | Proses klaim di background | ❌ Tidak |
| Redis | Antrian Celery | ❌ Tidak |

Worker **tidak punya** endpoint HTTP `/health`. Itu penyebab utama error `Healthcheck failed` kalau dikonfigurasi salah.

---

## Langkah 1 — Tambah service worker

1. Buka project Railway Anda (mis. `steadfast-nature`)
2. Klik **+ New** → **GitHub Repo**
3. Pilih repo: `tirtana888/superclaim`
4. Branch: `master` (atau branch deploy utama Anda)

---

## Langkah 2 — Nama service (penting!)

1. Klik service yang baru dibuat
2. **Settings → General → Service Name**
3. Isi nama yang **mengandung kata `worker`**, contoh:

```
superclaim-worker
```

Repo memakai `scripts/docker-entrypoint.sh` — script ini otomatis start Celery jika nama service mengandung `worker`.

| Nama service | Hasil |
|--------------|-------|
| `superclaim-worker` | ✅ Celery |
| `worker` | ✅ Celery |
| `superclaim-api` | ❌ Salah — ini jalan sebagai API |

**Alternatif:** jika nama tidak bisa pakai `worker`, set variable:

```
SUPERCLAIM_ROLE=worker
```

---

## Langkah 3 — Config file

1. **Settings → Config-as-code → Railway Config File**
2. Isi:

```
railway.worker.toml
```

Isi file tersebut (sudah ada di repo):

- Dockerfile: `Dockerfile` (sama dengan API)
- **Tanpa** `healthcheckPath`

---

## Langkah 4 — Matikan healthcheck (wajib!)

1. **Settings → Deploy**
2. Cari **Healthcheck Path** / **Health Check**
3. **Kosongkan** atau **Disable**

> Jangan set `/health` di worker. Celery tidak expose HTTP → deploy selalu gagal dengan pesan `1/1 replicas never became healthy`.

---

## Langkah 5 — Jangan buat public domain

Worker bersifat internal. Di **Settings → Networking**:

- **Jangan** klik Generate Domain
- Tidak perlu Custom Domain

Hanya API dan Dashboard yang butuh URL publik.

---

## Langkah 6 — Environment variables

Buka tab **Variables** pada service worker. Copy dari service API atau pakai **Shared Variables** di level project.

### Wajib

| Variable | Sumber | Contoh |
|----------|--------|--------|
| `REDIS_URL` | Reference Redis service | `${{Redis.REDIS_URL}}` |
| `REDIS_PRIVATE_URL` | *(opsional, direkomendasikan)* | `${{Redis.REDIS_PRIVATE_URL}}` |
| `SUPABASE_DB_URL` | Supabase → Database → URI | `postgresql+asyncpg://postgres:...@db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase → Settings → API | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → service_role key | `eyJ...` |
| `SUPABASE_STORAGE_BUCKET` | Nama bucket | `claim-media` |
| `SECRET_KEY` | Secret engine (sama dengan API) | string random panjang |
| `GEMINI_API_KEY` | Google AI Studio | `AIza...` |
| `MISTRAL_API_KEY` | Mistral console | `...` |

### Link Redis (cara paling mudah)

Di Variables worker, tambah:

```
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_PRIVATE_URL=${{Redis.REDIS_PRIVATE_URL}}
```

> **Hapus** variable `CELERY_RESULT_BACKEND` dan `CELERY_BROKER_URL` jika ada di Railway — nilai salah menyebabkan crash `No module named 'reseau'`.

Ganti `Redis` dengan nama service Redis Anda di Railway jika berbeda.

### Opsional

| Variable | Nilai |
|----------|-------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `SUPERCLAIM_ROLE` | `worker` (hanya jika nama service tidak mengandung `worker`) |

---

## Langkah 7 — Deploy

1. Klik **Deploy** → **Redeploy** (atau push merge ke `master` jika auto-deploy aktif)
2. Buka tab **Deploy Logs** (bukan Build Logs)

### Log sukses

```
Starting Celery worker (service=superclaim-worker)...
 -------------- celery@... v5.x
---- **** -----
--- * ***  * -- Linux-...
-- * - **** ---
- ** ---------- [config]
- ** ---------- .> app:         superclaim:...
- ** ---------- .> transport:   redis://...
- ** ---------- .> results:     redis://...
...
[tasks]
  . superclaim.health_check
  . superclaim.process_claim

[2026-...] celery@... ready.
```

### Log gagal (healthcheck)

```
====================
Starting Healthcheck
====================
Path: /health
...
Healthcheck failed!
```

**Solusi:** kembali ke Langkah 4 — matikan healthcheck di service **worker**, bukan API.

---

## Langkah 8 — Verifikasi

### A. Cek log worker

Deploy status harus **Active** / hijau, tanpa error healthcheck.

### B. Cek dari API

Buka URL API publik Anda:

```bash
curl https://YOUR-API.up.railway.app/health/celery
```

Respons sukses:

```json
{"status":"ok","celery":"ok"}
```

Respons gagal (worker/Redis bermasalah):

```json
{"status":"degraded","error_code":"CELERY_UNAVAILABLE",...}
```

### C. Tes end-to-end

1. Buka dashboard trial → `/submit`
2. Upload foto + submit klaim
3. Buka halaman detail klaim
4. Status berubah dari `processing` → `completed` dalam ~30–60 detik

---

## Diagram setup di Railway

```
Project: steadfast-nature
├── Redis                    ← Langkah 0 (sudah ada)
├── superclaim-api           ← API (healthcheck /health ON)
├── superclaim-worker        ← Tutorial ini (healthcheck OFF)
└── superclaim-dashboard     ← opsional (Next.js)
```

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Healthcheck failed` + `Path: /health` | Healthcheck aktif di worker | Matikan healthcheck (Langkah 4) |
| Log: `Starting API on port...` di worker | Nama service tidak mengandung `worker` | Rename ke `superclaim-worker` atau set `SUPERCLAIM_ROLE=worker` |
| `CELERY_UNAVAILABLE` | Worker mati atau Redis salah | Cek `REDIS_URL`, redeploy worker |
| Klaim stuck `processing` | Worker tidak consume queue | Cek log worker, pastikan Redis sama dengan API |
| `ModuleNotFoundError: reseau` | `CELERY_RESULT_BACKEND` salah di Railway | Hapus `CELERY_*` vars, pakai hanya `REDIS_URL` |
| DB error di worker | `SUPABASE_DB_URL` salah | Pastikan format `postgresql+asyncpg://`, password URL-encoded |
| `AUTH_FAILED` saat proses | `SECRET_KEY` beda dengan API | Samakan `SECRET_KEY` di API + worker |

---

## Checklist cepat

```
[ ] Service nama mengandung "worker" (superclaim-worker)
[ ] Config file: railway.worker.toml
[ ] Healthcheck: OFF
[ ] Public domain: tidak dibuat
[ ] REDIS_URL = reference ke Redis service
[ ] SUPABASE_* + SECRET_KEY + GEMINI + MISTRAL = sama dengan API
[ ] Deploy logs: "celery@... ready"
[ ] GET /health/celery → 200
[ ] Submit klaim trial → selesai diproses
```

---

## Referensi file di repo

| File | Fungsi |
|------|--------|
| `railway.worker.toml` | Config Railway untuk worker |
| `scripts/docker-entrypoint.sh` | Auto-detect API vs worker |
| `Dockerfile` | Image Docker (shared API + worker) |
| `app/celery_app.py` | Konfigurasi Celery |
| `app/tasks/claim_tasks.py` | Task `superclaim.process_claim` |

Panduan deploy lengkap (API + Redis + Dashboard): lihat [`DEPLOY-RAILWAY.md`](../DEPLOY-RAILWAY.md).
