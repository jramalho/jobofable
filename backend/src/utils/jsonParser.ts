import { AIProviderError } from './errors';

/**
 * Extracts and parses the first JSON object/array found in an LLM response.
 * Handles markdown code fences, leading prose and trailing commas.
 */
export function parseJsonFromLLM<T>(raw: string): T {
  const candidates = buildCandidates(raw);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      try {
        return JSON.parse(repairJson(candidate)) as T;
      } catch {
        // try next candidate
      }
    }
  }

  throw new AIProviderError('The AI provider returned a response that is not valid JSON.', {
    preview: raw.slice(0, 300),
  });
}

function buildCandidates(raw: string): string[] {
  const candidates: string[] = [];
  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) candidates.push(fenceMatch[1].trim());

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(trimmed.slice(firstBracket, lastBracket + 1));
  }

  candidates.push(trimmed);
  return candidates;
}

function repairJson(text: string): string {
  return text
    .replace(/,\s*([}\]])/g, '$1') // trailing commas
    .replace(/[“”]/g, '"') // smart quotes
    .replace(/[‘’]/g, "'");
}
