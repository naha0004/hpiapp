<<<<<<< HEAD
## ClearRideAI - Running Backend Services

### Web App (Next.js)
- Install deps: `pnpm install`
- Generate Prisma client: `pnpm exec prisma generate`
- Dev: `pnpm run dev`

### Python AI Backend (optional)
- Install Python deps: `pip3 install -r requirements-ai.txt`
- Start server: `python3 -m uvicorn api.ai.server:app --reload --port 8000`
- Health check: `curl http://localhost:8000/health`

Set `PYTHON_SERVICE_URL=http://localhost:8000` in your `.env.local` for the web app to call the Python backend.

### Environment
- Required (web): `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, email server vars
- Optional (AI): `OPENAI_API_KEY`, `ALLOWED_ORIGINS`
- Optional (HPI sandbox via OneAutoAPI):
  - `ONEAUTOAPI_API_KEY`
  - `ONEAUTOAPI_BASE_URL` (e.g. `https://sandbox.oneautoapi.com`)
  - `ONEAUTOAPI_HPI_PATH` (defaults to `/v1/hpi`)
- Optional (AI): `OPENAI_API_KEY`, `ALLOWED_ORIGINS`

### Notes
- Payments: amounts are enforced server-side.
- Webhook: idempotency recommended (store Stripe event IDs).
- Security headers are set via Next config; HSTS only in production.
=======
# hpiapp
>>>>>>> f1272c75b4ccce64c82222779688ac5a906f6ad1
