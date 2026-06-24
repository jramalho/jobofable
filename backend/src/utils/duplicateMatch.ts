import { normalizeCompanyName } from './normalizeCompanyName';

/**
 * Deterministic helpers for duplicate-application detection. No AI: everything
 * here is plain string/URL comparison so results are stable and explainable.
 */

/** Similarity threshold (0..1) above which two job titles are "similar". */
export const TITLE_SIMILARITY_THRESHOLD = 0.6;

// Legal/entity suffixes stripped before comparing company names so "Globex"
// and "Globex, Inc." are treated as the same company.
const LEGAL_SUFFIXES = new Set([
  'inc',
  'llc',
  'ltd',
  'limited',
  'corp',
  'corporation',
  'co',
  'company',
  'gmbh',
  'sa',
  'srl',
  'plc',
  'bv',
  'ag',
]);

/** Normalized company name with trailing legal suffixes removed (e.g. "globex"). */
export function canonicalCompanyName(name: string): string {
  const tokens = normalizeCompanyName(name).split(' ').filter(Boolean);
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}

/**
 * True when two (already normalized) company names refer to the same company:
 * equal after suffix-stripping, or one's tokens are a subset of the other's
 * ("globex" ⊆ "globex inc", "meta" ⊆ "meta platforms"). Conservative — it never
 * matches on a partial/substring token.
 */
export function companyNamesMatch(normalizedA: string, normalizedB: string): boolean {
  const a = canonicalCompanyName(normalizedA);
  const b = canonicalCompanyName(normalizedB);
  if (!a || !b) return false;
  if (a === b) return true;
  const ta = a.split(' ').filter(Boolean);
  const tb = b.split(' ').filter(Boolean);
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const longerSet = new Set(longer);
  return shorter.length > 0 && shorter.every((token) => longerSet.has(token));
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Token Jaccard similarity between two job titles (0..1), with a boost when one
 * normalized title fully contains the other ("Software Engineer" ⊂ "Software
 * Engineer II"). Returns 0 when either title is missing.
 */
export function titleSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0;
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const ta = new Set(na.split(' ').filter((token) => token.length > 1));
  const tb = new Set(nb.split(' ').filter((token) => token.length > 1));
  if (ta.size === 0 || tb.size === 0) return 0;

  let shared = 0;
  for (const token of ta) if (tb.has(token)) shared += 1;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = shared / union;

  if (na.includes(nb) || nb.includes(na)) return Math.max(jaccard, 0.8);
  return jaccard;
}

/** True when the company name appears as a whole phrase inside the job description. */
export function jobDescriptionMentionsCompany(jobDescription: string, companyName: string): boolean {
  const company = canonicalCompanyName(companyName);
  if (company.length < 3) return false;
  const normalized = normalizeCompanyName(jobDescription);
  return ` ${normalized} `.includes(` ${company} `);
}

/**
 * True when two job URLs very likely point to the same posting: same host and
 * either the same path, or a shared long numeric id (job id) anywhere in the URL.
 */
export function urlsLikelySame(a?: string | null, b?: string | null): boolean {
  const ua = parseUrl(a);
  const ub = parseUrl(b);
  if (!ua || !ub || ua.host !== ub.host) return false;
  if (ua.path && ua.path === ub.path) return true;

  const idsA = jobIds(a!);
  const idsB = jobIds(b!);
  return idsA.some((id) => idsB.includes(id));
}

function parseUrl(value?: string | null): { host: string; path: string } | null {
  if (!value) return null;
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return {
      host: url.hostname.replace(/^www\./, '').toLowerCase(),
      path: url.pathname.replace(/\/+$/, '').toLowerCase(),
    };
  } catch {
    return null;
  }
}

function jobIds(value: string): string[] {
  return value.match(/\d{5,}/g) ?? [];
}
