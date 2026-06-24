import { Comparison, CoverLetterTone, JobAnalysis, LinkedInAnalysis, ResumeAnalysis } from '../schemas/analysis.schema';
import { GROUNDING_RULES, JSON_OUTPUT_RULES } from './shared.prompt';

/**
 * Cover letter generation rules follow the research documented in
 * docs/coverletter.md: short, specific, evidence-based, never sycophantic.
 */
export const GENERATE_COVER_LETTER_SYSTEM_PROMPT = `You are an experienced software engineer who writes excellent, understated cover letters. Your letters read like a strong, real person wrote them to another person: never like an AI, never like a template, never sycophantic.

Write like a human:
- Use a natural, first-person voice with contractions (I'm, I've, didn't).
- Vary sentence length. Mix short, plain sentences with longer ones. Avoid a uniform, polished rhythm.
- Prefer simple, everyday words over corporate or "AI" vocabulary.
- NEVER use em dashes or en dashes (the "travessao": the — or – characters). Use commas, periods, or parentheses instead. Plain hyphens in compound words (real-time, well-known) are fine.

${GROUNDING_RULES}

${JSON_OUTPUT_RULES}`;

export const GENERATE_COVER_LETTER_SCHEMA_HINT = `{
  "coverLetter": string,                 // the full letter, paragraphs separated by blank lines
  "language": string,                    // e.g. "en"
  "detectedFocusAreas": string[],        // 2-4 themes the letter emphasizes (e.g. "React Native expertise", "remote collaboration")
  "warnings": string[]                   // anything inferred or missing (e.g. "Company name not found in job description; letter uses a generic opening")
}`;

const TONE_GUIDANCE: Record<CoverLetterTone, string> = {
  professional: 'Polished and professional. Warm but restrained. No slang.',
  direct: 'Short sentences, concrete claims, minimal adjectives. Get to the point fast.',
  confident: 'Assertive about real achievements without arrogance. Own the experience plainly.',
  human: 'Conversational and personable while staying professional. First-person, natural rhythm.',
  executive: 'Strategic, outcome-focused, calm authority. Emphasize scope, ownership and business impact.',
};

export interface GenerateCoverLetterPromptInput {
  job: JobAnalysis;
  resume: ResumeAnalysis;
  linkedIn?: LinkedInAnalysis;
  comparison: Comparison;
  tone: CoverLetterTone;
}

export function buildGenerateCoverLetterPrompt(input: GenerateCoverLetterPromptInput): string {
  return `Write a cover letter for this candidate applying to this job.

Structure (3-5 paragraphs total):
1. Short opening: name the position${input.job.companyName ? ' and the company' : ''} and a genuine, specific reason for interest. No "I am thrilled".
2. One or two paragraphs connecting 2-3 of the candidate's strongest REAL experiences to the job's key requirements. Use concrete evidence, not adjectives.
3. Optional paragraph showing impact, seniority, collaboration style or product context relevant to this role.
4. Simple closing that opens a conversation (e.g. "I'd be glad to talk about how my experience with X could help the team."). No begging, no over-thanking.

Hard rules:
- Write in English unless the job description is clearly in another language.
- TONE: ${TONE_GUIDANCE[input.tone]}
- Mention the company name only if it is actually known: ${input.job.companyName ?? 'NOT KNOWN — do not invent one'}.
- Mention the job title only if it is actually known: ${input.job.title ?? 'NOT KNOWN — refer to "this role"'}.
- Do not repeat the resume bullet-by-bullet; tell the connecting story instead.
- PUNCTUATION: never use em dashes or en dashes (— or –). Use commas, periods or parentheses. Plain hyphens in compound words are fine.
- Sound human: contractions are welcome, sentence lengths should vary, and the letter should feel written, not generated.
- Ban clichés and AI tells: "passionate about technology", "fast-paced environment", "team player", "perfect fit", "dream job", "hit the ground running", "I am writing to express", "I am excited to apply", "leverage", "delve", "spearheaded", "tapestry", "testament to", "in today's ... world", "furthermore", "moreover".
- No invented facts, metrics, companies, titles, technologies or certifications.
- If something relevant is missing from the candidate's material, add a warning instead of guessing.

JOB ANALYSIS:
${JSON.stringify(input.job, null, 2)}

CANDIDATE RESUME ANALYSIS:
${JSON.stringify(input.resume, null, 2)}

${
  input.linkedIn
    ? `CANDIDATE LINKEDIN ANALYSIS (auxiliary source):\n${JSON.stringify(input.linkedIn, null, 2)}`
    : 'No LinkedIn profile was provided.'
}

COMPARISON (strongest matching points to build the letter around):
${JSON.stringify(
    {
      strengths: input.comparison.strengths,
      requirementsCovered: input.comparison.requirementsCovered,
    },
    null,
    2,
  )}`;
}
