import { Comparison, JobAnalysis, LinkedInAnalysis, ResumeAnalysis } from '../schemas/analysis.schema';
import { GROUNDING_RULES, JSON_OUTPUT_RULES } from './shared.prompt';

export const GENERATE_RESUME_SYSTEM_PROMPT = `You are an expert resume writer specialized in ATS optimization for software/tech roles. You rewrite resumes to be stronger, clearer and tailored to a specific job — while staying 100% truthful to the candidate's real experience.

${GROUNDING_RULES}

${JSON_OUTPUT_RULES}`;

export const GENERATE_RESUME_SCHEMA_HINT = `{
  "header": { "name": string | null, "title": string | null, "location": string | null, "phone": string | null, "email": string | null, "linkedin": string | null, "github": string | null, "website": string | null },
  "summary": string,                          // 2-4 sentences, specific to this job, grounded in real experience
  "skills": [{ "category": string, "items": string[] }],
  "experience": [{ "company": string, "title": string, "location": string | null, "startDate": string | null, "endDate": string | null, "bullets": string[] }],
  "projects": [{ "name": string, "description": string, "technologies": string[], "bullets": string[] }],
  "education": [{ "institution": string, "degree": string | null, "field": string | null, "startDate": string | null, "endDate": string | null }],
  "certifications": [{ "name": string, "issuer": string | null, "date": string | null }],
  "languages": [{ "language": string, "level": string | null }]
}`;

export interface GenerateResumePromptInput {
  job: JobAnalysis;
  resume: ResumeAnalysis;
  linkedIn?: LinkedInAnalysis;
  comparison: Comparison;
  /** Job keywords that do NOT literally appear in the candidate's material. */
  missingKeywords: string[];
}

export function buildGenerateResumePrompt(input: GenerateResumePromptInput): string {
  return `Rewrite this candidate's resume optimized for the job below.

Your output is the FINAL, COMPLETE resume the candidate will send — not a list of suggestions:
- Include EVERY real experience, project, education entry, certification and language from the candidate's material. Never drop a section that exists in the original.
- Apply the improvements directly in the rewritten bullets; do not describe what could be improved.
- "header" must copy the candidate's contact details (name, title/headline, location, phone, email, linkedin, github, website) EXACTLY as they appear in the candidate's material. Use null for anything not present — never invent contact data.

ATS rules:
- Plain structure only: clear section titles, objective bullet points, no tables/columns/icons/images.
- Order skills by relevance to this job. Group them in 2-4 sensible categories.
- Keep all companies, titles, dates, degrees and certifications EXACTLY as the candidate wrote them.
- Rewrite weak or vague bullets into stronger, specific bullets — without inventing facts or metrics.
- Where a metric is missing but would help, write the bullet without a number (e.g. "Improved mobile app performance and stability across production flows").
- Use the job's keywords only where the candidate's real experience supports them.
- Highlight the experiences most relevant to this job first within each role's bullets.
- The summary must be specific to this job and grounded in real experience — no clichés.
- LinkedIn data may be used to enrich entries ONLY when it does not contradict the resume.

JOB ANALYSIS:
${JSON.stringify(input.job, null, 2)}

CANDIDATE RESUME ANALYSIS:
${JSON.stringify(input.resume, null, 2)}

${
  input.linkedIn
    ? `CANDIDATE LINKEDIN ANALYSIS (auxiliary source):\n${JSON.stringify(input.linkedIn, null, 2)}`
    : 'No LinkedIn profile was provided.'
}

ATS KEYWORDS FROM THE JOB THAT ARE MISSING FROM THE CANDIDATE'S CURRENT WORDING:
${JSON.stringify(input.missingKeywords)}

For each missing keyword, decide honestly:
- If the candidate's real experience clearly supports it, weave it in subtly — prefer the job's exact phrasing inside an EXISTING bullet, skill item or the summary, where it reads naturally. Examples of legitimate rewording: "App Store and Play Store release process" -> "app store submission workflows (App Store Connect, Google Play Console)"; "CI/CD" -> "continuous integration and continuous delivery (CI/CD)"; bridging native code -> "native modules". Do NOT stuff keywords: each one appears at most once or twice where it genuinely fits.
- If the experience does NOT support it (e.g. a framework or tool the candidate never used), SKIP it silently. Never list an unused technology, even inside a "familiar with" line.
- NEVER invent a new bullet to host a keyword. Keywords may only reword bullets that describe work the candidate actually stated.
- Activities are facts: "code reviews", "mentoring", "leading teams", "on-call" and similar may only appear if the candidate's material explicitly mentions them.
- Soft-skill and attitude phrases from the posting ("forensic attention to detail", "can-do attitude", "extreme ownership", "alignment with client goals") are NOT resume keywords. Never copy them into the resume — they belong in a cover letter, if anywhere.

COMPARISON / GAP ANALYSIS (use it to decide what to emphasize):
${JSON.stringify(
    {
      strengths: input.comparison.strengths,
      gaps: input.comparison.gaps,
      requirementsCovered: input.comparison.requirementsCovered,
      requirementsPartiallyCovered: input.comparison.requirementsPartiallyCovered,
    },
    null,
    2,
  )}`;
}
