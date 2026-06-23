# Railway service matrix — project `steadfast-nature`

| Service | Config | Dockerfile | Start command | Public URL |
|---------|--------|------------|---------------|------------|
| API | `railway.toml` | `Dockerfile` | uvicorn (auto) | Yes |
| Worker | `railway.worker.toml` | `Dockerfile.worker` | celery worker (auto) | No |
| Redis | (plugin) | — | — | No |
| Dashboard | `dashboard/railway.toml` | Nixpacks | `npm start` | Yes |

Worker **must not** use HTTP healthcheck — Celery has no `/health` endpoint.
