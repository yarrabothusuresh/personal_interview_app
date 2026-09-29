# Verification and Acceptance

## Automated checks

Run from the root:

```powershell
npm test
npm run build
```

Tests use synthetic input and mocked AI services; they do not verify live Gemini credentials or consume provider credits. Frontend journey tests run in jsdom, not a real browser. The PDF download journey mocks the download function; API parser tests separately extract text from an actual generated PDF.

| Area | Covered behavior |
|---|---|
| Parser | Actual PDF extraction, TXT, missing/empty/unsupported/oversized files, corrupt signature, binary text, excessive text |
| Schemas | Field bounds, experience, score, incomplete responses, full-report structure, distinct study days, normalized priority references |
| API | Health, safe public config, multipart generation, invalid JD, premium allow/deny, missing premium fields, rate limit |
| API client | Valid response, server error, HTML gateway response, malformed success, full-report fields, connection failure, timeout including body read, invalid public config |
| Components | Required form fields, upload/remove, score and gaps, alerts, search/filter/empty results |
| Journeys | Analysis → free pack → PDF action; state-preserving navigation; config retry; rejected then accepted premium code; guarded routes; no-AI sample |

## Live acceptance checklist

These checks remain manual and must be completed against the configured release environment:

- [ ] Verify the chosen Gemini model is available to the configured account.
- [ ] Submit `samples/resume.txt` with `samples/job-description.txt`; inspect the actual analysis for grounded strengths and gaps.
- [ ] Generate a full report; assess content relevance, accuracy, count, and all seven days.
- [ ] Exercise PDF export in a real browser; inspect pages, wrapping, page numbers, and downloads.
- [ ] Test desktop, tablet, mobile, keyboard-only navigation, and visible focus.
- [ ] Confirm configuration retry, provider errors, and rate-limit messaging on the deployed environment.
- [ ] Confirm refreshing clears session data and direct report URLs safely return home.
- [ ] Verify external payment destination and manually verify a real or provider-supported test payment.
- [ ] Confirm wrong premium codes fail and the operator-issued code succeeds on the deployed API.
- [ ] Verify HTTPS, exact CORS origin, secrets, proxy setting, static route fallback, and health monitoring.

## Release evidence

On 29 September 2026, `npm test` passed all **35 tests in 5 files** and `npm run build` completed successfully for backend and frontend. The build emitted non-blocking dependency comment-annotation warnings from Zod. The results are recorded in [verification.txt](verification.txt).

That evidence covers local tests and compilation only. Hosted deployment, real payment processing, Docker, provider availability, and full browser visual acceptance are not certified by those results.
