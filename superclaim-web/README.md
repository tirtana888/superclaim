# SuperClaim Web

Stripe-style frontend for SuperClaim.ai (Next.js 14, shadcn/ui, TanStack Query).

## Surfaces

- **Marketing** — `/`, `/pricing`
- **Auth** — `/login`, `/signup`
- **Brand dashboard** — `/overview`, `/claims`, `/policies`, `/api-keys`, `/team`, `/usage`, `/devices`
- **Hosted claim page** — F10 (not yet)

## Setup

```bash
cd superclaim-web
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your FastAPI backend (Railway URL)
npm install
npm run dev
```

Open http://localhost:3000

## Railway deploy

Create a new service pointing to `superclaim-web/` with:

- **Root directory:** `superclaim-web`
- **Build:** `npm run build`
- **Start:** `npm start`
- **Env:** `NEXT_PUBLIC_API_URL=https://your-api.railway.app`

## Session status

| Session | Status |
|---------|--------|
| F1 Setup + tokens + lib | Done |
| F2 Auth | Done |
| F3 Dashboard shell | Done |
| F4 Overview | Done |
| F5 Claims list + detail | Done |
| F6 Policy builder (full) | Partial — create + activate |
| F7 Devices | List only |
| F8 API keys | Done |
| F9 Team + usage | Done |
| F10 Hosted claim page | Pending |
| F11 Marketing polish | Basic |
