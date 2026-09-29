# Setup, Deployment, and Support Runbook

## Local setup

Use Node.js 22.13+ or the project's recommended Node 24. In the project root:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Set the private Gemini key in `.env`, select a model available to that account, then restart the API. Open `http://localhost:5173`; the API listens on port 8080 by default. The shipped model string is a configuration default, not a live-verified availability guarantee.

## Configuration reference

| Variable | Default / meaning |
|---|---|
| PORT | 8080; API port |
| GEMINI_API_KEY | Empty; required for real generation |
| GEMINI_MODEL | `gemini-3.8-flash`; verify account availability before launch |
| AI_TIMEOUT_MS | 120000; total operation budget across at most two attempts |
| FRONTEND_URL | `http://localhost:5173`; exact permitted browser origin |
| PREMIUM_MODE | `false`; `true` enables server-enforced access code |
| PREMIUM_ACCESS_CODE | Empty; set a strong private code for premium mode |
| PAYMENT_LINK | Empty; use an HTTPS payment destination |
| TRUST_PROXY | 0 locally; template uses 1 for one trusted proxy |
| VITE_API_URL | Empty locally; public API origin for separate hosting |

The frontend generation timeout is 250 seconds and configuration timeout is 15 seconds. Keep the backend operation budget below the frontend timeout with time for upload and parsing. Use positive integer timeout/port values and the actual trusted proxy topology. The current backend does not validate every numeric environment variable at startup.

## Build and run

```powershell
npm test
npm run build
npm start
```

`npm start` serves only the compiled API. Serve `frontend/dist` through a static host with fallback to `index.html` for client routes. Do not expect the API root to serve the website.

## Hosted deployment

1. Render: use `render.yaml`, configure secret variables, set exact frontend origin. Build: `npm ci && npm run build -w backend`; start: `npm run start -w backend`; health path `/api/health`.
2. Netlify: use `netlify.toml`; set public `VITE_API_URL` before build. The included redirect supports client-side routes.
3. Keep provider keys and access codes out of frontend variables, logs, repository contents, and documentation.
4. Run the live acceptance checklist in [TESTING.md](TESTING.md).

Docker alternative, from the project root:

```powershell
docker build -f backend/Dockerfile -t interview-prep-api .
docker run --rm -p 8080:8080 --env-file .env interview-prep-api
```

Docker and hosted deployment have not been exercised as part of this handover. The API uses an in-memory rate limiter: one instance is the intended MVP topology. Restarting clears request counters.

## Manual premium fulfillment

Enable premium mode, configure the HTTPS payment link and a strong code, then restart. Verify each payment in the payment provider's own system before supplying the code through the operator's existing support process. The application does not send messages, verify receipts, issue codes, or maintain purchase records. Rotate the shared code when necessary; all holders of the old code lose access after rotation. A generated/downloaded report is unaffected.

## Troubleshooting

| Symptom | Investigation |
|---|---|
| API not reachable | Check process, assigned port, host health, public API URL |
| Browser alone cannot connect | Check exact CORS origin and HTTPS configuration |
| Health OK but generation fails | Health is process-only; check provider key, model access, quota, timeout |
| Payment configuration error | Retry in the UI, check `/api/config` and payment URL |
| Premium always rejected | Check premium mode and matching nonempty server code |
| Too many requests | Wait for window reset; investigate shared proxy/IP configuration |
| Long report rejected | Schema validation failed or budget expired; inspect safe attempt status, not resume contents |
| Deep-link 404 | Check static host SPA redirect |

Log only operational metadata. Correlate `X-Request-Id` with API logs; do not request real resumes or provider secrets in bug reports. Reproduce with the synthetic samples. Keep prior deployed artifacts available to roll back; no database migration is required for this MVP. There are no application report backups because there is no report storage.
