/**
 * Deterministic keyword matching: checks which job keywords literally appear
 * in the candidate's material. This keeps "keywords found/missing" honest
 * instead of trusting the LLM to self-report matches.
 */
export interface KeywordMatchResult {
  found: string[];
  missing: string[];
}

/**
 * Equivalence groups so a keyword still matches when the resume uses a common
 * variant (the JD says "CI/CD", the resume says "continuous integration").
 * Stored in normalized form. Only unambiguous tech equivalences — no short,
 * noisy acronyms ("ai", "ml", "ui", "rn") that collide with ordinary prose.
 */
const SYNONYM_GROUPS: string[][] = [
  ['ci/cd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  ['oidc', 'openid connect'],
  ['oauth 2.0', 'oauth2', 'oauth'],
  ['sso', 'single sign-on', 'single sign on'],
  ['orm', 'object-relational mapping'],
  ['rest', 'restful', 'rest api', 'rest apis'],
  ['graphql', 'graph ql'],
  ['kubernetes', 'k8s'],
  ['postgresql', 'postgres'],
  ['amazon web services', 'aws'],
  ['google cloud platform', 'gcp'],
  ['internationalization', 'i18n'],
  ['accessibility', 'a11y'],
  ['end-to-end', 'e2e'],
  ['react native', 'react-native'],
];

/** All equivalent forms of a (normalized) keyword, including itself. */
function variantsOf(normalizedKeyword: string): string[] {
  const group = SYNONYM_GROUPS.find((forms) => forms.includes(normalizedKeyword));
  return group ?? [normalizedKeyword];
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

    // A keyword counts as present if it OR any known variant appears literally.
    const present = variantsOf(dedupeKey).some((form) => containsKeyword(normalizedText, form));
    (present ? found : missing).push(cleaned);
  }

  return { found, missing };
}

/** Literal presence of a single keyword form (no synonym expansion). */
export function keywordPresent(keyword: string, text: string): boolean {
  return containsKeyword(normalize(text), normalize(keyword));
}

/** Count of literal occurrences of a keyword in text (for stuffing detection). */
export function countKeywordOccurrences(keyword: string, text: string): number {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return 0;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}(?=[^a-z0-9]|$)`, 'gi');
  return (normalize(text).match(pattern) ?? []).length;
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
