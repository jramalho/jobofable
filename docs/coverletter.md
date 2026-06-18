# Cover Letter Guide — JobFit Resume AI

Practical research on modern cover letter writing for tech roles, with a focus on
international, remote and software engineering positions. This document is the
source of truth for the rules implemented in
`backend/src/prompts/generateCoverLetter.prompt.ts` and
`backend/src/services/coverLetter.service.ts`.

---

## 1. Purpose of a cover letter

**When a cover letter helps**

- When the role is competitive and many resumes look similar on paper — the letter is the only place to tell the *connecting story* between your experience and this specific job.
- When something on the resume needs context: a career transition, relocation, a gap, contract/agency work, or applying from another country to a remote role.
- When the company explicitly asks for one (skipping it signals low interest).
- For international remote roles, where written communication **is** the job interview: a clear, well-structured letter is direct evidence of the main skill remote teams hire for.

**When it should be short**

- Always. Recruiters spend seconds on a first pass. 3–5 short paragraphs, under one page, ideally 150–300 words.
- If the job posting marks it optional and your fit is obvious, an even shorter letter (3 paragraphs) is better than a long one.

**Why it must not repeat the resume**

- The recruiter already has the resume — repeating it wastes the only space you have to add new information.
- The letter's job is *selection and connection*: pick the 2–3 most relevant experiences and explain **why** they matter for this role, which a bullet list cannot do.

**How it should connect real experience to the job**

- Take requirements straight from the job description and answer each with concrete, real evidence: "You need X; at Company A I did X in production for two years, including Y."
- Use the job's own vocabulary (keywords) only where the experience genuinely supports it.

**How to show fit without sounding sycophantic**

- Evidence over enthusiasm. "I've built and shipped React Native apps used in production for three years" beats "I would be absolutely thrilled to join your amazing team".
- One sentence of genuine, specific interest in the company/product is enough. Specificity ("I've followed your migration to a local-first sync engine") reads as research; generic praise ("industry-leading innovative company") reads as a template.

---

## 2. Recommended structure

1. **Opening (2–3 sentences).** Name the position and, when known, the company. Give one genuine, specific reason for interest. No "I am writing to express my interest…" boilerplate — get to the point.
2. **Evidence paragraph(s) (1–2 paragraphs).** Connect 2–3 of your strongest *real* experiences to the job's key requirements. Concrete: technologies in production, scope, kind of problems solved. Real metrics if you have them; never invented ones.
3. **Context paragraph (optional).** Show impact, seniority, collaboration style or product context that matters for *this* role: leading initiatives, mentoring, working with design/product, async remote collaboration, client-facing work.
4. **Closing (1–2 sentences).** Simple and conversational: "I'd be glad to talk about how my experience with X could help the team." No begging, no over-thanking, no "I eagerly await your response".

---

## 3. Market best practices

- Personalize for the company **and** the role — at minimum the title, the top requirements, and one specific reason for interest.
- Use real keywords from the job description; some companies screen cover letters with the same ATS as resumes.
- Never invent experience, metrics, employers, titles or certifications.
- Ban generic filler: "team player", "fast-paced environment", "passionate about technology" (without concrete context), "perfect fit".
- Keep it short: 3–5 paragraphs, under one page.
- Tone: professional, human and direct — write like a strong candidate talking to a future colleague, not like a lawyer or a marketing bot.
- Show evidence of fit, not flattery for the company.
- Don't restate resume bullets; tell the story that links them.
- Make the "why this candidate for this job" reasoning explicit — that is the entire value of the letter.
- For international/remote roles: state time zone/overlap availability when relevant, and demonstrate written clarity (the letter itself is the proof).

## 4. Bad practices (what kills a cover letter)

- A generic letter that could be sent to any company unchanged.
- Stiff, robotic formality ("To whom it may concern, I hereby submit…").
- Exaggerated enthusiasm and superlatives ("dream company", "absolutely thrilled").
- Copying internet templates verbatim — recruiters recognize them instantly.
- Invented metrics or inflated claims ("improved performance by 40%" with no data behind it).
- Repeating the entire resume in prose form.
- Never mentioning the actual role or company.
- Centering what the candidate wants ("this role would be a great step for my growth") instead of the value they deliver.

---

## 5. Base templates (structural reference only)

These templates are internal references for **structure and emphasis** — never to be copied literally. Bracketed parts are slots the generator fills with the candidate's real data.

### React Native Engineer

> P1: Applying for [title] at [company]; one line on why this mobile product specifically.
> P2: Real RN experience — apps shipped to App Store/Play Store, native modules, performance work, offline/sync; mirror the JD's stack (TypeScript, state management, CI for mobile).
> P3: Production maturity — crash monitoring, release process, collaboration with design/backend.
> P4: Simple close opening a conversation about the mobile roadmap.

### Senior Software Engineer

> P1: Position + a specific technical or product reason for interest.
> P2: Depth: systems owned end-to-end, architectural decisions, real scale context (only if true).
> P3: Seniority signals: mentoring, technical leadership, cross-team collaboration, raising the bar on quality.
> P4: Close connecting that seniority to the team's current challenges.

### Mobile Engineer

> P1: Role + platform focus (iOS/Android/cross-platform) matching the JD.
> P2: Apps shipped, store presence, platform constraints handled (permissions, push, offline, app size, reviews).
> P3: User-facing quality mindset: performance, accessibility, release discipline.
> P4: Short close.

### Product Engineer

> P1: Role + genuine interest in the product domain.
> P2: Experience shipping user-facing features fast, working from ambiguous specs, using data/feedback to iterate.
> P3: Collaboration with PM/design, ownership beyond the ticket, pragmatic engineering trade-offs.
> P4: Close oriented to building the product together.

### International Remote Role

> P1: Role + company; one line establishing remote readiness.
> P2: Real experience matching the stack, framed around autonomous delivery.
> P3: Remote-specific evidence: async communication, documentation habits, time-zone overlap, English proficiency demonstrated by the letter itself, prior distributed-team experience (only if true).
> P4: Close mentioning availability for a call across time zones.

### Product-focused role

> P1: Role + what about the product's mission/users is genuinely interesting.
> P2: Experience tied to user or business outcomes (real ones), not just technical output.
> P3: How the candidate works with product/design and handles measurement and iteration.
> P4: Simple close.

### Agency / client-facing role

> P1: Role + interest in multi-client/consulting context.
> P2: Experience across multiple projects/stacks, fast context switching, delivering within budget and deadline constraints.
> P3: Client-facing skills: expectation management, clear communication with non-technical stakeholders, professionalism under pressure.
> P4: Close offering to discuss how that versatility helps the agency's clients.

### Startup role

> P1: Role + a specific reason the startup's problem space is interesting.
> P2: Breadth + ownership: shipping with limited resources, wearing multiple hats, bias to action (real examples).
> P3: Comfort with ambiguity, pragmatic quality trade-offs, building 0→1 (only if true).
> P4: Energetic but sober close — no "rocket ship" clichés.

---

## 6. Rules for automatic generation

The system generates the cover letter from, and only from:

1. **Job Description** — analyzed into title, company, requirements, keywords, domain.
2. **Uploaded resume** — the primary source of truth about the candidate.
3. **LinkedIn PDF (when provided)** — auxiliary source; conflicts with the resume produce warnings, never silent merges.
4. **User-selected tone** — `professional`, `direct`, `confident`, `human` or `executive`, mapped to explicit style guidance in the prompt.
5. **The rules in this document** — encoded in `generateCoverLetter.prompt.ts` (structure, length, cliché ban, anti-hallucination rules, simple conversational close).

Hard constraints enforced by the prompt and validated by `coverLetter.service.ts`:

- 3–5 paragraphs, English by default.
- Company/position mentioned only when actually known; otherwise generic phrasing **plus a warning** in `coverLetterMeta.warnings`.
- 2–3 real experiences connected to the job's requirements.
- No invented facts, metrics, employers, titles, technologies or certifications.
- Missing information produces honest warnings instead of guesses.

## Research limitations

This document was created based on general recruiting and career-writing best practices. External sources should be validated later before using this as a public-facing guide.
