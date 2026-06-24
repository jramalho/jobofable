import { OptimizedResume } from '../schemas/resume.schema';
import { GROUNDING_RULES, JSON_OUTPUT_RULES } from './shared.prompt';

/**
 * Third-pass prompt: when deterministic checks find a keyword repeated so often
 * it reads as stuffing (which modern ATS penalize), this round asks the model
 * to thin it out — something regex cannot do without breaking sentences. It
 * only removes the repeated keyword, never the underlying real accomplishment.
 */
export const DE_STUFF_SYSTEM_PROMPT = `You are an expert resume editor. You fix keyword over-use (stuffing) without changing any facts and without weakening any real accomplishment.

${GROUNDING_RULES}

${JSON_OUTPUT_RULES}`;

export interface DeStuffInput {
  resume: OptimizedResume;
  overused: { keyword: string; count: number }[];
}

export function buildDeStuffPrompt(input: DeStuffInput): string {
  const list = input.overused
    .map((entry) => `- "${entry.keyword}" (currently appears ${entry.count} times)`)
    .join('\n');

  return `The resume JSON below over-uses some keywords, which reads as keyword stuffing and is penalized by modern ATS. Reduce ONLY the over-used keywords.

OVER-USED KEYWORDS:
${list}

How to reduce each one:
- Bring it down to at most 2-3 mentions across the whole resume, in different contexts.
- Prefer keeping it in the summary and in the first bullet of the most relevant role; thin out the weaker, repetitive mentions.
- When you remove the keyword from a sentence, REWRITE that sentence so it stays grammatical and still describes the same real work. Never leave a broken fragment, and never use a noun phrase where it does not fit.
- Keep the accomplishment: only the repeated keyword is thinned, never the underlying achievement.

Strict rules:
- Change ONLY what is needed to reduce the listed keywords. Every other bullet, and every fact — companies, titles, dates, metrics, education, certifications, languages, contact details — stays EXACTLY as provided.
- Keep ALL sections and ALL roles. Never drop or merge a role.
- Return the COMPLETE resume JSON, same structure as the input.

RESUME JSON:
${JSON.stringify(input.resume, null, 2)}`;
}
