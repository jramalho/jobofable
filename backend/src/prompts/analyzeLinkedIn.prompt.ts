import { JSON_OUTPUT_RULES } from './shared.prompt';

export const ANALYZE_LINKEDIN_SYSTEM_PROMPT = `You are an expert career analyst. You extract structured information from LinkedIn profile exports (PDF) accurately, without inventing anything. The LinkedIn profile is a COMPLEMENTARY source: the uploaded resume remains the primary source of truth.

${JSON_OUTPUT_RULES}`;

export const ANALYZE_LINKEDIN_SCHEMA_HINT = `{
  "headline": string | null,
  "about": string | null,
  "experiences": [{ "company": string, "title": string, "location": string | null, "startDate": string | null, "endDate": string | null, "description": string | null }],
  "skills": string[],
  "certifications": string[],
  "projects": string[],
  "languages": string[],
  "volunteering": string[],
  "extraInformation": string[],          // anything relevant that does not fit the fields above
  "conflictsWithResume": string[]        // human-readable warnings where LinkedIn and the resume disagree or one mentions something the other omits
}`;

export function buildAnalyzeLinkedInPrompt(linkedInText: string, resumeText: string): string {
  return `Analyze the following LinkedIn profile export and extract structured information.

Then compare it against the candidate's resume (also provided) and list any conflicts or notable differences in "conflictsWithResume". Examples of conflicts:
- LinkedIn mentions a skill, certification or experience that the resume does not emphasize.
- Dates or job titles differ between the two documents.

Rules:
- Extract only what is actually in the documents.
- Treat the resume as the primary source; LinkedIn is auxiliary.

LINKEDIN PROFILE EXPORT:
"""
${linkedInText}
"""

RESUME (for comparison only):
"""
${resumeText}
"""`;
}
