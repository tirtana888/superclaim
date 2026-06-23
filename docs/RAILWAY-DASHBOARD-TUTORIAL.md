# Tutorial: Deploy Dashboard Trial SuperClaim di Railway

Panduan deploy **Next.js dashboard** untuk trial submit klaim — upload foto, kirim ke engine, lihat hasil AI.

> **Prasyarat:** Service **API** (`superclaim-api`) sudah online dengan public domain.

---

## Apa yang didapat?

| Halaman | URL | Fungsi |
|---------|-----|--------|
| Dashboard | `/` | Stats + tabel klaim |
| **Trial Submit** | `/submit` | Form upload foto + submit klaim |
| Detail klaim | `/claims/{id}` | Hasil AI (polling otomatis) |

```
Browser → Dashboard (Railway) → API (Railway) → Worker → Supabase
              ↓
         baca hasil dari Supabase (read-only)
```

---

## Langkah 1 — Tambah service dashboard

1. Buka project Railway (`steadfast-nature`)
2. **+ New** → **GitHub Repo**
3. Pilih repo: `tirtana888/superclaim`
4. Branch: `master`

---

## Langkah 2 — Root Directory (penting!)

1. Klik service dashboard yang baru
2. **Settings → Source → Root Directory**
3. Isi:

```
dashboard
```

Tanpa ini Railway akan build folder root (Python API) bukan Next.js.

---

## Langkah 3 — Build & Deploy settings

| Setting | Nilai |
|---------|-------|
| **Config file path** | `railway.toml` *(otomatis dari folder `dashboard/`)* |
| **Builder** | Railpack (bukan Nixpacks — deprecated) |
| **Build Command** | `npm install && npm run build` |
| **Custom Start Command** | *(kosong — pakai `npm run start` dari config)* |
| **Healthcheck Path** | `/` |
| **Healthcheck Timeout** | `120` |

Isi `dashboard/railway.toml` di repo:

```toml
[build]
builder = "RAILPACK"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/"
healthcheckTimeout = 120
```

---

## Langkah 4 — Generate public domain

1. **Settings → Networking → Generate Domain**
2. Catat URL, misalnya:

```
https://superclaim-dashboard-production.up.railway.app
```

---

## Langkah 5 — Environment variables

Tab **Variables** pada service dashboard:

| Variable | Nilai | Wajib |
|----------|-------|-------|
| `SUPERCLAIM_API_URL` | `https://YOUR-API.up.railway.app` | ✅ |
| `SUPERCLAIM_API_KEY` | `sc_globalbeli_dev_2026` | ✅ |
| `SUPERCLAIM_TENANT_ID` | `e1b52fb2-2fb0-4c4d-b9b3-e46e4edec9d6` | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rlszvadiebttvguupegp.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | *(dari Supabase → Settings → API → service_role)* | ✅ |
| `NODE_ENV` | `production` | opsional |

### Contoh copy-paste

```
SUPERCLAIM_API_URL=https://superclaim-api-production.up.railway.app
SUPERCLAIM_API_KEY=sc_globalbeli_dev_2026
SUPERCLAIM_TENANT_ID=e1b52fb2-2fb0-4c4d-b9b3-e46e4edec9d6
NEXT_PUBLIC_SUPABASE_URL=https://rlszvadiebttvguupegp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

> `SUPERCLAIM_API_URL` **tanpa** slash di akhir.  
> API key disimpan server-side — tidak exposed ke browser.

---

## Langkah 6 — Deploy

1. Klik **Deploy** / tunggu auto-deploy dari push `master`
2. Build log sukses:

```
npm install && npm run build
✓ Compiled successfully
```

3. Deploy log sukses:

```
next start -p 8080   (atau PORT Railway)
Ready on http://0.0.0.0:8080
```

---

## Langkah 7 — Tes trial flow

### A. Cek dashboard hidup

Buka:

```
https://YOUR-DASHBOARD.up.railway.app
```

Harus tampil halaman **Claims Dashboard** dengan stats cards.

### B. Cek engine terhubung

Buka:

```
https://YOUR-DASHBOARD.up.railway.app/submit
```

Banner hijau: **"Engine API online — siap terima klaim trial."**

Kalau kuning/offline → cek `SUPERCLAIM_API_URL` di Variables.

### C. Submit klaim trial

1. Klik **Trial Submit** atau `/submit`
2. Isi form (claim ID auto-generate)
3. Upload foto kerusakan (JPG/PNG)
4. Klik **Submit klaim trial**
5. Redirect ke `/claims/CLM-TRIAL-xxxx`
6. Tunggu ~30–60 detik → status & decision AI muncul

### D. Pantau di dashboard

Kembali ke `/` — klaim baru muncul di tabel (refresh otomatis 3 detik).

---

## Diagram services di Railway

```
steadfast-nature/
├── Redis
├── superclaim-api          ← engine REST API
├── superclaim-worker       ← Celery AI pipeline
└── superclaim-dashboard    ← tutorial ini (Next.js)
         Root Directory: dashboard
```

---

## Settings lengkap (copy reference)

| Setting | Dashboard |
|---------|-----------|
| Root Directory | `dashboard` |
| Config file | `railway.toml` (in dashboard/) |
| Builder | Nixpacks |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |
| Healthcheck | `/` |
| Public domain | ✅ Yes |

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Build gagal / Python error | Root Directory salah | Set `dashboard` |
| Healthcheck failed | PORT / build error | Cek deploy logs, pastikan `npm run build` sukses |
| Engine API offline di `/submit` | `SUPERCLAIM_API_URL` salah | URL API Railway yang benar, tanpa `/` akhir |
| Submit gagal 502 | API key / tenant salah | Cek `SUPERCLAIM_API_KEY` + `SUPERCLAIM_TENANT_ID` |
| Tabel klaim kosong | Supabase key salah | Cek `SUPABASE_SERVICE_ROLE_KEY` |
| Klaim stuck processing | Worker mati | Cek `/health/celery` di API |
| Permission denied Supabase | GRANT belum jalan | Jalankan migration grant di Supabase |

---

## Checklist deploy

```
[ ] Root Directory = dashboard
[ ] SUPERCLAIM_API_URL → domain API Railway
[ ] SUPERCLAIM_API_KEY + TENANT_ID ter-set
[ ] SUPABASE_SERVICE_ROLE_KEY ter-set
[ ] Generate domain dashboard
[ ] /submit → banner hijau "Engine API online"
[ ] Submit foto → decision AI muncul
[ ] / → klaim muncul di tabel
```

---

## Alternatif: Vercel (lebih cepat untuk Next.js)

1. [vercel.com](https://vercel.com) → Import `tirtana888/superclaim`
2. **Root Directory**: `dashboard`
3. Env variables sama seperti tabel Langkah 5
4. Deploy → dapat URL `*.vercel.app`

---

## Referensi

- Worker setup: [`RAILWAY-WORKER-TUTORIAL.md`](RAILWAY-WORKER-TUTORIAL.md)
- Deploy lengkap: [`DEPLOY-RAILWAY.md`](../DEPLOY-RAILWAY.md)
- Env contoh: [`dashboard/.env.local.example`](../dashboard/.env.local.example)
