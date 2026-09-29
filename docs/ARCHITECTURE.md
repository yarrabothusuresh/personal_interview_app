# Architecture and Flow Diagrams

## Components and ownership

| Component | Responsibility | State |
|---|---|---|
| React app | Routes, forms, report study, browser PDF export | Current tab memory |
| API client | Multipart requests, timeouts, error translation, response checks | No persistence |
| Express middleware | Security headers, CORS, rate limit, upload limits, request ID | Per-process IP counters |
| Resume parser | UTF-8 and PDF text extraction and length checks | Request memory |
| AiService interface | Separates HTTP routes from provider implementation and test doubles | None |
| GeminiAiService | Prompt, structured output, bounded retries, schema validation | Request memory |
| Shared schemas | Input and report contracts, semantic uniqueness checks | None |
| Payment operator | Confirms external payment and supplies code manually | Outside this application |

## Architecture diagram

![Architecture](diagrams/architecture.svg)

Editable Mermaid source:

```mermaid
flowchart LR
  User[Candidate] --> UI[React SPA]
  UI --> PDF[Local PDF download]
  UI -->|Multipart HTTP| API[Express API]
  API --> Security[Rate limit and premium check]
  Security --> Parser[In-memory resume parser]
  Parser --> AI[GeminiAiService]
  AI <-->|Server-only API key| Gemini[Google Gemini]
  AI --> Validation[Zod response validation]
  Validation --> API
  API -->|JSON response| UI
  Shared[Shared Zod contracts] -.-> Validation
  Shared -.-> UI
  UI -->|External link| Payment[Payment provider]
  Payment -->|Operator verifies manually| Operator[Operator]
  Operator -->|Shared access code| User
```

## User flow diagram

![User flow](diagrams/user-flow.svg)

```mermaid
flowchart TD
  Home[Home] --> Sample[Sample preview and PDF]
  Home --> Form[Resume + JD + role + experience]
  Form --> Valid{Valid input?}
  Valid -->|No| Correct[Show errors and correct fields]
  Correct --> Form
  Valid -->|Yes| Analyze[Generate free analysis]
  Analyze --> Result[Review strengths, gaps, sample Q&A]
  Analyze -->|Failure| Retry[Show error and allow retry]
  Retry --> Form
  Result --> Pricing[Full pack page]
  Pricing --> Config{Configuration loaded?}
  Config -->|No| Reconnect[Retry connection without refresh]
  Reconnect --> Pricing
  Config -->|Yes| Premium{Premium enabled?}
  Premium -->|No| Generate[Generate full pack]
  Premium -->|Yes| Pay[External payment and manual verification]
  Pay --> Code[Enter access code]
  Code --> Authorized{Server accepts code?}
  Authorized -->|No| Code
  Authorized -->|Yes| Generate
  Generate --> Report[Search, filter, expand answers, study plan]
  Generate -->|Failure| Pricing
  Report --> Download[Download paginated PDF]
```

## Generation sequence

```mermaid
sequenceDiagram
  actor Candidate
  participant UI as React client
  participant API as Express API
  participant Parser as Resume parser
  participant AI as Gemini service
  participant Google as Google Gemini
  Candidate->>UI: Submit resume and fields
  UI->>API: Multipart POST
  API->>API: Rate limit, upload bounds, premium check if required
  API->>API: Validate fields
  API->>Parser: Extract and validate text
  Parser-->>API: Resume text
  API->>AI: Analyze or fullReport
  AI->>Google: Prompt + data + JSON Schema
  Google-->>AI: Generated JSON
  AI->>AI: Parse and validate
  opt Provider failure or invalid output, budget remaining
    AI->>Google: One retry or repair attempt
    Google-->>AI: Generated JSON
    AI->>AI: Parse and validate
  end
  AI-->>API: Valid report or safe error
  API-->>UI: JSON response
  API->>API: Clear upload buffer in route cleanup
  UI->>UI: Validate success response
  UI-->>Candidate: Results or recovery message
```

## Trust boundaries and deployment

The browser is untrusted: field limits and premium checks are repeated at the API. CORS governs browser access and is not authentication. The payment provider has no callback into this API. Only the operator's configured code authorizes premium generation. Provider output is untrusted until validated. Prompt instructions label resume and JD content as data, although this is not a guarantee against all prompt injection.

Locally Vite proxies `/api` to port 8080. The provided hosting templates deploy static frontend files to Netlify and the Node API to Render. `VITE_API_URL` is public build-time configuration; `GEMINI_API_KEY` and `PREMIUM_ACCESS_CODE` exist only on the API server. Docker packages the backend, not a combined frontend host.
