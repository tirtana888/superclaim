## Summary

<!-- Apa yang berubah dan kenapa -->

## Railway deploy checklist

- [ ] Perubahan hanya di API → cukup redeploy service `superclaim-api`
- [ ] Perubahan worker/Celery → redeploy `superclaim-worker`
- [ ] Worker pakai `railway.worker.toml` + `Dockerfile.worker` (bukan `railway.toml`)
- [ ] Worker healthcheck **OFF** (tidak ada `/health`)
- [ ] Env vars (`REDIS_URL`, `SUPABASE_*`, `SECRET_KEY`, AI keys) masih valid

## Test plan

- [ ] `GET /health` → 200
- [ ] `GET /health/celery` → 200
- [ ] Submit klaim trial di `/submit` → hasil AI muncul
