# JobFit Resume AI

Paste a job description, upload your current resume (PDF/DOCX) and optionally your LinkedIn PDF export — get back an ATS-optimized resume tailored to that job, a personalized cover letter, a 0–100 match score with per-category explanations, and honest gap/keyword analysis. Export everything as PDF or DOCX.

**Honest by design:** the AI improves wording, structure and positioning. It never invents experience, companies, titles, education, certifications, metrics or skills. When data is missing, it says so in a warning instead of guessing.

## Highlights

- **ATS-optimized resume + cover letter** generated from one job description, grounded in your real experience.
- **0–100 match score** with per-category justifications, plus literal (non-hallucinated) keyword found/missing analysis.
- **Saved profile (local-only):** your resume is cached in the browser so the next analysis needs only a new job description — no re-upload, and the parsing + resume-extraction AI call are skipped entirely. Nothing is stored on the server.
- **Smart export filenames:** exports are named `name_company.pdf` (e.g. `jose_silva_google.pdf`), with the company pulled from the job description.
- **Name spacing fix:** glued names from PDF extraction (`JonathanOliveira`) are restored to `Jonathan Oliveira` on output.
- **Provider-agnostic AI:** Groq (cloud) or Ollama (local), switchable per request.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, Redux Toolkit, RTK Query, TailwindCSS 4 |
| Backend | Node.js 20, TypeScript, Express, Multer, Zod |
| Parsing | `pdf-parse` (PDF), `mammoth` (DOCX) |
| Export | `pdfkit` (PDF), `docx` (DOCX) |
| AI | Groq (cloud) or Ollama (local), behind a provider-agnostic `AIProvider` interface |

## Project layout

```
backend/   Express API (routes → controllers → services → providers/prompts/schemas/utils)
frontend/  Vite React SPA (pages → feature hooks → dumb components, Redux Toolkit + RTK Query)
docs/      coverletter.md — research + rules that drive cover letter generation
```

## Running the backend

```bash
cd backend
cp .env.example .env   # fill in your provider config (see below)
npm install
npm run dev            # starts http://localhost:3001
```

Health check: `GET http://localhost:3001/api/health`

## Running the frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL defaults to http://localhost:3001/api
npm install
npm run dev            # starts http://localhost:5173
```

## Configuring Groq

1. Create an API key at https://console.groq.com.
2. In `backend/.env`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.1-70b-versatile
```

The key lives only in the backend `.env` — it is never sent to or readable from the frontend.

## Configuring Ollama

1. Install Ollama (https://ollama.com) and pull a model: `ollama pull qwen2.5:14b`
2. In `backend/.env`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
```

The default provider comes from `AI_PROVIDER`, and each analysis request can override it via the provider dropdown in the UI (`aiProvider` form field).

## Environment variables

Backend (`backend/.env.example`):

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `3001` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `AI_PROVIDER` | `groq` or `ollama` | `groq` |
| `GROQ_API_KEY` | Groq API key | — |
| `GROQ_MODEL` | Groq model id | `llama-3.1-70b-versatile` |
| `GROQ_BASE_URL` | Groq OpenAI-compatible base URL | `https://api.groq.com/openai/v1` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model | `qwen2.5:14b` |
| `MAX_FILE_SIZE_MB` | Upload size limit | `5` |

Frontend (`frontend/.env.example`):

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` |

## Product flow

1. **Home** (`/`) — product pitch and "Generate optimized application" CTA.
2. **New analysis** (`/new-analysis`) — paste the job description, provide your resume (upload a PDF/DOCX **or** reuse a saved profile), upload LinkedIn export (optional, PDF), pick cover letter tone and AI provider, submit. If you have a saved profile, the resume upload is optional and the form shows "Reusing your saved profile".
3. **Backend pipeline** — validate input → get the resume text (extract from the uploaded file, or reuse the cached one) → analyze job, resume and LinkedIn in parallel (the resume-extraction call is skipped when a saved profile is sent) → compare candidate vs job and score adherence → generate optimized resume + cover letter in parallel → return one structured JSON response (including the analyzed `profile`, so the client can cache it). Files are processed in memory only — nothing is saved to disk on the server.
4. **Result** (`/result/:analysisId`) — match score, per-category scores with justifications, keywords found/missing, gaps, recommendations, warnings, plus editors for the resume and cover letter and PDF/DOCX export buttons. All edits live in Redux and the export endpoints receive the *edited* version. Exports are named after the candidate + company.

## Main endpoints

| Method & path | Purpose |
| --- | --- |
| `POST /api/analysis` | multipart/form-data: `jobDescription`, **either** `resumeFile` **or** `savedProfile` (JSON `{ resume, resumeText }`), `linkedInFile?`, `coverLetterTone?`, `aiProvider?` → full analysis JSON (includes a `profile` the client caches) |
| `POST /api/analysis/keywords` | JSON `{ resume, jobTitle?, selections[], aiProvider? }` → weaves user-confirmed missing keywords into the chosen targets |
| `POST /api/export/resume/pdf` | JSON `{ resume, candidateName?, companyName?, jobTitle? }` → PDF download (filename `name_company.pdf`) |
| `POST /api/export/resume/docx` | same body → DOCX download |
| `POST /api/export/cover-letter/pdf` | JSON `{ coverLetter, candidateName?, companyName?, jobTitle? }` → PDF download |
| `POST /api/export/cover-letter/docx` | same body → DOCX download |
| `GET /api/health` | health check |

## How resume generation works

1. `analyzeJob` / `analyzeResume` / `analyzeLinkedIn` prompts extract structured JSON from each input (Zod-validated, defensive parsing).
2. `ats.service.ts` runs the comparison prompt for scores (each with a short evidence-based justification) **and** matches the job's keywords literally against the candidate's raw text — so "keywords found/missing" can't be hallucinated by the model.
3. `resume.service.ts` runs `generateResume.prompt.ts`, which enforces the grounding rules: companies, titles, dates, degrees and certifications are preserved exactly; weak bullets are rewritten without inventing facts or metrics; job keywords are used only where the real experience supports them. The missing ATS keywords from step 2 are fed into the prompt so truthful ones get woven subtly into existing bullets/skills (using the job's exact phrasing, e.g. "App Store Connect"), while unsupported ones (frameworks/tools never used) are skipped silently. Output is structured JSON (header, summary, skills, experience, projects, education, certifications, languages) — contact details always come from the extraction pass, never from generation.
4. A deterministic post-generation guard (`enforceActivityClaims`) removes activity claims the model sneaks in ("code reviews", "mentoring", team leadership...) when the candidate's original material doesn't mention them, and surfaces a warning so the user can add them back manually if they are actually true.

## How cover letter generation works

`coverLetter.service.ts` receives the job analysis, resume analysis, optional LinkedIn analysis, the comparison result and the user's tone. It builds the prompt from `generateCoverLetter.prompt.ts`, which encodes the rules researched in `docs/coverletter.md`: 3–5 paragraphs, specific opening, 2–3 real experiences connected to the job's requirements, cliché ban, simple conversational close, English by default, and zero invented facts. The service validates the response and returns the editable letter plus metadata (tone, language, detected focus areas) and warnings (e.g. company name not found).

## How `docs/coverletter.md` works

It is the research document behind the cover letter feature: purpose, recommended structure, market best/bad practices, structural templates per role type (React Native, Senior SWE, Mobile, Product, International Remote, Product-focused, Agency, Startup) and the rules the generator must follow. The prompt in `generateCoverLetter.prompt.ts` is the executable encoding of that document — when you change the rules there, update the prompt accordingly.

## Saved profile (browser-local)

So you don't re-upload (or re-pay for re-parsing) your resume on every job:

- The resume is stored in the browser's **IndexedDB** (`frontend/src/lib/profileStorage.ts`) — never on the server. A "Save this resume in this browser" checkbox controls it.
- **Phase 1 — skip re-upload:** the saved file pre-fills the upload field on the new-analysis page.
- **Phase 2 — skip re-parsing:** after the first run, the backend returns the *analyzed* resume (`profile: { resume, resumeText }`); the client caches it and, on the next analysis, sends it as `savedProfile` instead of a file. The backend then skips both document parsing and the resume-extraction LLM call, using the new job description against the cached resume.
- Uploading a new file at any time replaces the cached profile and forces a fresh parse. "Forget saved resume" clears it.

## Export filenames & name spacing

- **Filenames:** resume/cover-letter downloads are named from the candidate name + the company captured from the job description, slugified (accents stripped, e.g. `José Silva` + `Google` → `jose_silva_google.pdf`). Falls back to `optimized-resume.*` when both are missing. Logic in `frontend/src/lib/apiClient.ts` (authoritative, drives the actual download name) and mirrored in `backend/src/utils/exportFilename.ts` (Content-Disposition).
- **Name spacing:** `backend/src/utils/personName.ts` restores spaces in names that PDF/DOCX extraction glued together (`JonathanOliveira` → `Jonathan Oliveira`, `JOAOSilva` → `JOAO Silva`), applied when the optimized resume header is built. The resume-extraction prompt also instructs the model to keep names spaced — covering the only case code can't split safely, a fully lowercase glued name (`joaosilva`).

## MVP limitations

- No server-side persistence: analyses live in the frontend's Redux state only; refreshing the result page loses the session (the `analysisId` is not retrievable from the server). The saved profile is the one exception, and it lives only in the user's browser (IndexedDB), not on the server.
- The saved profile is per-browser and not synced across devices; clearing browser storage removes it.
- No authentication, accounts, billing or rate limiting.
- One language (English) for generated documents; UI in English.
- Scanned/image-only PDFs are rejected (no OCR).
- Quality of the analysis depends on the configured model; small local models may produce weaker JSON.
- Cover letter research document pending validation against external sources (see `docs/coverletter.md` → Research limitations).

## Next steps

- Persist analyses (database + `GET /api/analysis/:id`) so result links survive refresh and can be shared.
- Auth + multi-tenant accounts to become a real SaaS; per-user history, and a server-synced saved profile so it works across devices (the browser-local profile is the first step toward this).
- Streaming progress (SSE) during the pipeline instead of a single long request.
- More providers behind `AIProvider` (OpenAI-compatible, Anthropic), retries and fallback provider.
- Multi-language generation, richer resume editor (add/remove entries), template themes for export.
- Automated tests (unit for services/utils, e2e for the pipeline with a mock provider).
