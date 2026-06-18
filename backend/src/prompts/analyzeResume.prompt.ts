import { JSON_OUTPUT_RULES } from './shared.prompt';

export const ANALYZE_RESUME_SYSTEM_PROMPT = `You are an expert resume reviewer and career coach. You extract structured information from resumes accurately and critique them honestly. You never invent information that is not in the resume.

${JSON_OUTPUT_RULES}`;

export const ANALYZE_RESUME_SCHEMA_HINT = `{
  "candidateName": string | null,
  "currentTitle": string | null,            // the headline/title under the name, verbatim
  "location": string | null,                // e.g. "Curitiba, PR, Brazil", verbatim
  "email": string | null,
  "phone": string | null,
  "linkedin": string | null,                // linkedin URL or handle, verbatim
  "github": string | null,
  "website": string | null,
  "summary": string | null,                  // the candidate's current summary/objective, verbatim or near-verbatim
  "technicalSkills": string[],
  "softSkills": string[],
  "experiences": [{ "company": string, "title": string, "location": string | null, "startDate": string | null, "endDate": string | null, "description": string | null }],
  "projects": string[],                      // short one-line descriptions of personal/professional projects
  "education": string[],                     // e.g. "BSc Computer Science — University X (2015-2019)"
  "certifications": string[],
  "languages": string[],                     // e.g. "English (fluent)"
  "strengths": string[],
  "weaknesses": string[],
  "vagueSections": string[],                 // quotes or paraphrases of vague passages
  "genericSections": string[],               // quotes or paraphrases of generic/filler passages
  "improvementSuggestions": string[],
  "doNotChange": string[]                    // factual data that must never be altered: names, companies, titles, dates, degrees, certifications
}`;

export function buildAnalyzeResumePrompt(resumeText: string): string {
  return `Analyze the following resume and extract structured information plus an honest critique.

Rules:
- Extract only what is actually in the resume. Missing fields must be null or empty arrays.
- "candidateName" must keep normal spacing between first/middle/last names. PDF extraction sometimes glues them together ("JonathanOliveira", "JONATHANOLIVEIRA") — restore the spaces so the name reads as a person would write it ("Jonathan Oliveira"). Never merge separate names into one token.
- "weaknesses", "vagueSections" and "genericSections" should be honest and specific.
- "doNotChange" must list the hard facts (companies, titles, dates, degrees, certifications) exactly as written.

RESUME:
"""
${resumeText}
"""`;
}
