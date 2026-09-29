# InterviewPrep AI — Final Project Document

Version: 1.0 MVP · Handover date: 29 September 2026

## Purpose and delivery scope

InterviewPrep AI turns a resume and a target job description into a skill-gap analysis and a personalized interview preparation pack. This delivery completes the existing session-based MVP. It does not add the future features listed in the README, such as accounts, saved history, voice interviews, or automated billing.

The code, automated tests, deployment templates, and documentation are included in this project. Live Gemini generation, hosted deployment, and real payment settlement require operator configuration and live acceptance checks; they are not claimed as verified by automated tests.

## Documentation map

| Document | Purpose |
|---|---|
| [Architecture and diagrams](ARCHITECTURE.md) | Components, trust boundaries, request sequence, and user flow |
| [User guide](USER-GUIDE.md) | Steps for each implemented user journey |
| [API contract](API.md) | Endpoints, validation, response structure, and errors |
| [Operations runbook](OPERATIONS.md) | Installation, configuration, deployment, payments, and troubleshooting |
| [Verification and acceptance](TESTING.md) | Automated coverage, live acceptance checklist, and limitations |
| [Change record](CHANGELOG.md) | Review fixes and completion work |
| [Architecture image](diagrams/architecture.svg) | Standalone scalable diagram |
| [Flow image](diagrams/user-flow.svg) | Standalone scalable journey diagram |

## Implemented flows

| Flow | Implemented behavior | Main code |
|---|---|---|
| Resume submission | PDF/TXT selection or drop, size validation, JD, role, and experience fields | `frontend/src/components/ResumeForm.tsx` |
| Free analysis | Multipart upload, server validation, text extraction, Gemini request, response validation | `backend/src/app.ts`, `backend/src/services/` |
| Analysis review | Estimated score, evidence summary, strengths, gaps, five topics, five sample Q&As | `frontend/src/pages/AnalysisPage.tsx` |
| Free full pack | With premium mode disabled, reuse the current submission to generate a full pack | `frontend/src/App.tsx` |
| Premium full pack | External payment link, manual operator verification, server-checked shared access code | `frontend/src/pages/PaymentPage.tsx`, `backend/src/app.ts` |
| Report study | Category filters, search, expandable answers, ten priority references, seven-day study plan | `frontend/src/components/Questions.tsx`, `frontend/src/pages/PremiumReportPage.tsx` |
| PDF download | Browser-generated, paginated PDF with report content, study plan, and page numbers | `frontend/src/utils/pdfGenerator.ts` |
| Sample preview | Curated 12-question sample with no AI call and an explicit sample label | `frontend/src/data/sample.ts` |
| Recovery | Validation errors, provider errors, connection retry, malformed-response rejection, guarded report routes | API client, app routes, shared schemas |
| Session navigation | Internal links retain app state; home-section links scroll to the target | `frontend/src/components/Layout.tsx` |
| Privacy and support | Privacy page, safe API messages, request identifiers, health endpoint | `frontend/src/App.tsx`, `backend/src/app.ts` |

## Architecture

![Architecture](diagrams/architecture.svg)

The frontend is a React/TypeScript single-page application built with Vite and Tailwind. The Express backend owns provider credentials, premium authorization, rate limiting, upload handling, and Gemini calls. Shared Zod schemas validate inputs and generated report structure. The browser validates generated responses again before rendering them.

There is no database. The browser holds the submission and report in memory; refresh or closing the page clears that state. Uploaded bytes and extracted text are processed in server memory. Route cleanup zeroes the uploaded buffer after processing; JavaScript text and provider-side retention are not subject to guaranteed memory erasure by the application.

## End-to-end flow

![User flow](diagrams/user-flow.svg)

The full-report request submits the resume and fields again. The free-analysis identifier is not a stored entitlement or server-side report reference. A full pack is independently generated, so its summary and score may differ from the earlier free analysis.

## Functional rules

- Resume: one non-empty PDF or UTF-8 TXT, maximum 5 MB; extracted text 50–20,000 characters.
- Job description: 100–12,000 characters after trimming. Role: 2–120 characters.
- Experience: one of the five defined experience bands.
- Analysis: score 0–100, exactly five priority topics and five sample questions.
- Full report: ten resume questions, five system-design questions, five behavioral questions, two to five AI questions, and bounded optional technology sections.
- Report validation rejects duplicate question text, repeated priority references after case/whitespace normalization, and repeated study days.
- The prompt requests 52 or 55 questions when every Java-track category applies. Optional technology counts are bounded by the schema; relevance and exact optional counts remain model-dependent.
- AI calls: at most two application attempts within the configured operation budget. Invalid output triggers a fresh repair instruction.
- Limit: ten interview requests per IP per hour per backend process, including unsuccessful requests.
- Premium: server-side code validation is mandatory when enabled. Payment-page navigation never authorizes a report.

## Completion and release status

The implemented MVP has automated coverage and production build checks. See [TESTING.md](TESTING.md) for the recorded results and outstanding live checks. “Code complete” here means the flows above are implemented; it does not mean payment processing, hosting, or the selected Gemini model has been certified in production.

## Known limits and future scope

No login, database, saved history, OCR, subscriptions, webhook verification, per-purchase entitlement, admin console, email fulfillment, voice interviews, or background job queue is implemented. The premium code is reusable and shared. Scaling to multiple API instances requires a shared rate-limit store. PDFs primarily support English/Latin text. AI relevance and factual quality require user judgment. These constraints are deliberate MVP boundaries and should be revisited before a larger commercial launch.
