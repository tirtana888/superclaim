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
| F6 Policy builder (full) | Done — edit rules, test panel, activate, new version |
| F7 Devices | Done — add, bulk CSV, search, delete |
| F8 API keys | Done — create, rotate, revoke |
| F9 Team + usage | Done — invite, usage chart |
| F10 Hosted claim page | Done — `/claim/[brandSlug]` |
| F11 Marketing polish | Done — how-it-works, footer, CTA |
