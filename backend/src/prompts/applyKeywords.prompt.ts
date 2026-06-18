import { OptimizedResume } from '../schemas/resume.schema';
import { GROUNDING_RULES, JSON_OUTPUT_RULES } from './shared.prompt';

/**
 * Second-pass prompt: the user reviewed the missing ATS keywords and
 * explicitly confirmed which ones reflect real experience — and where they
 * belong. This is the only place where adding a previously-absent keyword
 * is allowed, because the user vouches for it.
 */
export const APPLY_KEYWORDS_SYSTEM_PROMPT = `You are an expert resume editor. You apply precise, surgical edits to a resume JSON without touching anything else.

${GROUNDING_RULES}

EXCEPTION TO THE RULES ABOVE: the user has explicitly confirmed that the keywords listed in the instructions reflect their real experience. Adding THOSE keywords, exactly where instructed, is allowed and expected. Every other truthfulness rule still applies: no invented metrics, companies, titles, certifications, dates or scope.

${JSON_OUTPUT_RULES}`;

export interface ResolvedKeywordInstruction {
  keyword: string;
  /** Human-readable target, e.g. 'experience "Invillia — Senior Mobile Developer"' */
  targetLabel: string;
}

export interface ApplyKeywordsPromptInput {
  resume: OptimizedResume;
  jobTitle?: string;
  instructions: ResolvedKeywordInstruction[];
}

export function buildApplyKeywordsPrompt(input: ApplyKeywordsPromptInput): string {
  const instructionLines = input.instructions
    .map((entry, index) => `${index + 1}. Add "${entry.keyword}" to ${entry.targetLabel}.`)
    .join('\n');

  return `Apply the following user-confirmed keyword additions to the resume JSON below${
    input.jobTitle ? ` (the resume targets a "${input.jobTitle}" position)` : ''
  }.

INSTRUCTIONS:
${instructionLines}

How to apply each instruction:
- Target is an EXPERIENCE: weave the keyword into one of that role's existing bullets where it reads naturally. If no existing bullet fits, add ONE short, conservative new bullet to that role describing work with that keyword — no metrics, no inflated scope. Never add it to a different role.
- Target is the SKILLS section: add the keyword to the most fitting existing skill category, or create one sensible new category if none fits.
- Target is the SUMMARY: mention the keyword naturally in the summary. Do not turn the summary into a keyword list.

Strict editing rules:
- Change ONLY what the instructions require. Every other field — header, dates, companies, titles, untouched bullets, education, certifications, languages — must be returned EXACTLY as provided.
- Use the keyword's exact wording (it comes from the job description).
- A keyword may appear in MULTIPLE instructions (e.g. one experience AND the skills section): add it in EVERY listed target, and nowhere else. Within each target it appears once.
- Return the COMPLETE updated resume JSON with the same structure as the input.

RESUME JSON:
${JSON.stringify(input.resume, null, 2)}`;
}
