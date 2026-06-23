# Railway service matrix — project `steadfast-nature`

| Service | Name pattern | Dockerfile | Healthcheck | Public URL |
|---------|--------------|------------|-------------|------------|
| API | `superclaim-api` | `Dockerfile` | `/health` ON (Railway UI) | Yes |
| Worker | `*worker*` in name | `Dockerfile` (same) | OFF | No |
| Redis | (plugin) | — | — | No |
| Dashboard | `dashboard/` root | Nixpacks | `/` | Yes |

📖 Worker setup: [`docs/RAILWAY-WORKER-TUTORIAL.md`](../docs/RAILWAY-WORKER-TUTORIAL.md)

Entrypoint `scripts/docker-entrypoint.sh` starts Celery when `RAILWAY_SERVICE_NAME` contains `worker`, otherwise uvicorn on `$PORT`.

Worker **must not** use HTTP healthcheck.
