/**
 * Deterministic keyword matching: checks which job keywords literally appear
 * in the candidate's material. This keeps "keywords found/missing" honest
 * instead of trusting the LLM to self-report matches.
 */
export interface KeywordMatchResult {
  found: string[];
  missing: string[];
}

export function matchKeywords(keywords: string[], candidateText: string): KeywordMatchResult {
  const normalizedText = normalize(candidateText);
  const found: string[] = [];
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const keyword of keywords) {
    const cleaned = keyword.trim();
    if (!cleaned) continue;
    const dedupeKey = normalize(cleaned);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (containsKeyword(normalizedText, dedupeKey)) {
      found.push(cleaned);
    } else {
      missing.push(cleaned);
    }
  }

  return { found, missing };
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsKeyword(normalizedText: string, normalizedKeyword: string): boolean {
  if (!normalizedKeyword) return false;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // word-ish boundaries that still work for "c#", "node.js", "ci/cd"
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return pattern.test(normalizedText);
}
