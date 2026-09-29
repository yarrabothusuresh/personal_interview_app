# InterviewPrep AI

A focused interview preparation MVP: upload a PDF/TXT resume, add a job description, get a free skill-gap analysis, generate a complete preparation pack, and download a paginated PDF.

## Final delivery documentation

Start with [the final project document](docs/FINAL-PROJECT-DOCUMENT.md) for implemented flows and scope. Supporting documents: [architecture and diagrams](docs/ARCHITECTURE.md), [user guide](docs/USER-GUIDE.md), [API contract](docs/API.md), [operations runbook](docs/OPERATIONS.md), [verification checklist](docs/TESTING.md), and [change record](docs/CHANGELOG.md).

## Architecture

React + TypeScript + Vite + Tailwind → Express API → in-memory ResumeParserService → AiService / GeminiAiService → schema-validated JSON. React never calls Gemini or receives an API key. Shared Zod schemas keep input and response types consistent. No database, login, queue, or permanent resume storage.

## Features

- PDF/TXT upload (5 MB), drag and drop, clear field validation and rotating loading messages.
- Estimated match score, supported skills, missing skills, five priority topics and five sample questions.
- Full report with role-relevant question categories, detailed answers, simple explanations, examples, common mistakes and follow-ups.
- Search, category filters, accessible disclosure controls, ten priority questions and a seven-day study plan.
- Downloadable, paginated PDF and a clearly labeled curated sample preview.
- ₹199 payment-link page with manual access-code fulfillment in premium mode.
- Helmet, configured CORS, 10 requests/IP/hour, input limits, provider timeout, and at most two AI attempts.
- Responsive desktop, tablet and mobile layout; self-hosted Inter fonts.

## Prerequisites and local setup

Use Node.js 22.13+ (Node 24 recommended) and npm. From this repository root:

```powershell
npm install
Copy-Item .env.example .env
```

Do not overwrite an existing `.env`. Obtain a Gemini API key through [Google AI Studio](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY` in `.env`. Keep it private and never use a `VITE_` prefix for secrets. The SDK is the official `@google/genai`; structured output follows [Google's documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

```powershell
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Health: http://localhost:8080/api/health

`npm run dev` starts both servers. Restart after changing environment variables. The sample report at `/sample` works without a key; real generation returns a clear configuration error if the key is absent. No simulated response is substituted for real submissions.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Backend port; defaults to 8080 |
| `GEMINI_API_KEY` | Private server-only Gemini credential |
| `GEMINI_MODEL` | Model ID, defaults to `gemini-3.8-flash`; change as model availability evolves |
| `AI_TIMEOUT_MS` | Total AI operation budget; default 120000 ms across at most two attempts |
| `FRONTEND_URL` | Exact permitted frontend origin, e.g. `https://your-site.netlify.app` |
| `PREMIUM_MODE` | `false` for local free full-report generation; `true` to enforce access code |
| `PAYMENT_LINK` | HTTPS payment page opened in a new tab |
| `PREMIUM_ACCESS_CODE` | Strong private operator-issued code; required for premium reports when premium mode is enabled |
| `TRUST_PROXY` | 0 locally; 1 for a single trusted Render reverse proxy |
| `VITE_API_URL` | Frontend build-time backend origin for separate hosting; blank locally |

Never expose `PREMIUM_ACCESS_CODE` in frontend variables or public documentation. Public `/api/config` returns only AI availability, premium mode, and the payment URL.

## Try the required scenario

1. Upload `samples/resume.txt`.
2. Paste `samples/job-description.txt` into the job description field.
3. Enter **Senior Java Developer**, select **10–15 years**, and click **Generate Free Analysis**.
4. Expect Java, Spring Boot, Kafka, microservices and REST to be supported; Kubernetes, AWS and generative AI should be gaps. The model's exact score and wording may vary.
5. Open the upgrade page and select **Generate Full Interview Pack** with `PREMIUM_MODE=false`.
6. Expand a question, select Kafka, search for a topic, review all seven study days and download the PDF.

Only synthetic test materials are included. The sample preview contains 12 curated questions; real complete Java-track reports request 55 questions (or 52 with only two AI-awareness questions), with ten priority references rather than duplicated question bodies. Irrelevant technology categories are empty for other roles.

## API

- `GET /api/health`: service health.
- `GET /api/config`: non-secret client configuration.
- `POST /api/v1/interview/analyze`: multipart `resume`, `jobDescription`, `targetRole`, `experience`.
- `POST /api/v1/interview/full-report`: same fields, plus `accessCode` when premium mode is enabled.

The model response is constrained by JSON Schema and validated with Zod. Invalid output receives one repair attempt. Provider errors receive one retry, bounded by the total timeout. The frontend timeout is longer than the backend budget. Files are processed only in memory and buffers are cleared after each request. Errors use safe messages; no raw provider response or resume content is logged.

## Tests and production build

```powershell
npm test
npm run build
npm start
```

Tests cover actual PDF text extraction, TXT and file validation, JD validation, response schemas, health, multipart API handling with an injected AI service, premium authorization, rate limits, frontend validation, result/error rendering, filtering and search. Tests do not consume Gemini credits. `npm start` serves the compiled API; the built frontend is in `frontend/dist` for static hosting.

## Deployment

### Render API

Use the included `render.yaml` blueprint or create a Node web service from the repository. Build: `npm ci && npm run build -w backend`. Start: `npm run start -w backend`. Health path: `/api/health`. Configure the server variables above, using Render's assigned `PORT`. Set `FRONTEND_URL` to the Netlify origin. Use one instance for this MVP's in-memory rate limiter.

### Netlify frontend

Import the repository; `netlify.toml` specifies build `npm run build -w frontend`, publish `frontend/dist`, and the SPA redirect. Set `VITE_API_URL=https://your-api.onrender.com` before building. Do not set provider keys in Netlify frontend build variables. After deployment, verify CORS, `/api/health`, a synthetic upload, full generation, PDF download, and the configured payment link.

### Backend Docker

Run from the repository root:

```powershell
docker build -f backend/Dockerfile -t interview-prep-api .
docker run --rm -p 8080:8080 --env-file .env interview-prep-api
```

Docker is optional. The container runs as a non-root user. Secrets are excluded from the build context. Supply environment variables at runtime.

## Payment operations and limitations

Opening or returning from the payment page is never treated as proof of payment. In premium mode, the backend requires the configured access code. The operator must verify payment separately and share the code through their own support channel. This is deliberately a small manual-fulfillment MVP, not automated billing. The code is shared and reusable, not a per-purchase entitlement. Rotate it as needed; use verified webhooks and per-purchase tokens before scaling paid access. Leave premium mode off only for local development or an intentionally free trial.

## Privacy and operational notes

- No database or permanent uploads. Input/report state lives in browser memory and is lost on refresh; PDF downloads remain on the user's device.
- Resume and job text are sent to Google Gemini. Provider retention and usage policies depend on the provider/account terms; do not imply the app controls provider retention.
- Application logs contain only operational metadata. Hosting providers may maintain their own logs.
- Resume text is limited to 20,000 characters; JD to 12,000 (minimum 100). Scanned/image-only PDFs need OCR outside this MVP; encrypted PDFs are rejected.
- AI assessments can be wrong. The match score estimates textual alignment and is not an objective hiring probability.
- PDF export uses built-in Latin fonts. Non-Latin scripts and emoji are not fully supported; English is the intended MVP output language.
- Rate limits are per process and reset on restart; no multi-instance shared rate store is included. Set proxy trust only to the actual deployment topology.
- Long model outputs may fail validation or timeout and show a retryable error. Model availability and account quotas depend on Google.

## Future enhancements (not implemented)

Login/Google login, saved reports and history, AI/voice mock interviews, resume improvement, job search, verified Razorpay webhooks, subscriptions, admin tools, analytics, email/WhatsApp reports, referral program.

## Important source files

- `frontend/src/App.tsx`: routing and session-only workflow state.
- `frontend/src/components/ResumeForm.tsx`: validated upload form.
- `frontend/src/components/Questions.tsx`: filters, search and answer disclosures.
- `frontend/src/pages/PremiumReportPage.tsx`: complete report and study plan.
- `frontend/src/utils/pdfGenerator.ts`: paginated export.
- `backend/src/app.ts`: API and security boundaries.
- `backend/src/services/`: provider abstraction and resume parsing.
- `backend/src/prompts/interview.prompt.ts`: reusable interview prompt.
- `shared/interview.ts`: shared validation and response types.
- `design/concept.png` and `design/DESIGN.md`: visual reference and tokens.
"# personal_interview_app" 
