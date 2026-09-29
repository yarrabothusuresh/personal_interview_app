# API Contract

Base path: backend origin. All responses disable caching. The server supplies `X-Request-Id` for support correlation. No session cookie, login, database identifier, or stored report endpoint exists.

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Process health; does not prove Gemini connectivity |
| GET | `/api/config` | Public `aiConfigured`, `premiumMode`, `paymentLink` |
| POST | `/api/v1/interview/analyze` | Free analysis |
| POST | `/api/v1/interview/full-report` | Complete pack, access code required in premium mode |

POST bodies use `multipart/form-data`. Let the HTTP client generate the boundary.

| Field | Type | Constraint |
|---|---|---|
| resume | File | Exactly one PDF/TXT; non-empty, up to 5 MB; parsed text 50–20,000 chars |
| jobDescription | String | Trimmed length 100–12,000 |
| targetRole | String | Trimmed length 2–120 |
| experience | String | `0–2 years`, `3–5 years`, `6–9 years`, `10–15 years`, `15+ years` |
| accessCode | String | Required only for premium full-report requests |

TXT MIME types accepted by the parser: `text/plain` or `application/octet-stream`. PDFs require `application/pdf` and a PDF signature. Binary or invalid UTF-8 TXT files are rejected. Upload limits also cap fields, field size, and multipart parts.

## Successful output

Analysis fields: `candidateSummary`, `matchScore`, `matchExplanation`, `strongSkills`, `missingSkills`, `priorityTopics`, `sampleQuestions`. Each sample question includes `question`, `shortAnswer`, `difficulty`, `category`.

Full reports add `resumeBasedQuestions`, `javaQuestions`, `springBootQuestions`, `microservicesQuestions`, `kafkaQuestions`, `systemDesignQuestions`, `aiQuestions`, `behavioralQuestions`, `mostLikelyQuestions`, `studyPlan`.

Each full question includes `question`, `category`, `difficulty`, `relevance`, `answer`, `simpleExplanation`, `practicalExample`, `commonMistakes`, `followUpQuestions`. Study days include `day`, `title`, `tasks`. Exact machine-readable validation is in `shared/interview.ts`.

The API adds a generated `analysisId` to successful responses. It is not backed by storage and cannot be used to retrieve results. Browser schema parsing uses the report content and may strip extra metadata.

## Error behavior

| Status | Typical cause | Recovery |
|---|---|---|
| 400 | Invalid fields, unsupported or unreadable file, malformed upload | Correct input |
| 402 | Missing/invalid premium code | Obtain valid operator code |
| 404 | Unknown endpoint | Correct path |
| 413 | File over 5 MB | Reduce file size |
| 429 | Ten interview requests/IP/hour exceeded | Wait for reset |
| 500 | Unexpected application failure | Use request ID to investigate |
| 502 | Provider failed or output remained invalid | Retry within rate limit |
| 503 | Gemini key absent | Operator configures provider |

Errors contain an `error` string; some include `requestId` in the JSON body. Validation and rate-limit responses do not all include that property, so use the response header when available. The client maps HTML gateway responses and connection failures to readable messages.

## Example using synthetic files

From the project root in PowerShell:

```powershell
curl.exe http://localhost:8080/api/health
curl.exe -X POST http://localhost:8080/api/v1/interview/analyze -F "resume=@samples/resume.txt;type=text/plain" -F "jobDescription=<samples/job-description.txt" -F "targetRole=Senior Java Developer" -F "experience=10–15 years"
```

This POST calls the configured Gemini provider and may consume credits. The automated tests inject a mock service instead.
