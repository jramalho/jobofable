/**
 * Job-board sources behind one interface (mirrors the AIProvider pattern). Each
 * source fetches from a public job API and normalizes results to NormalizedJob.
 * A failing source returns [] so it never breaks the aggregated search.
 */

export interface JobSearchQuery {
  keywords: string[];
  remoteOnly: boolean;
  limit: number;
}

export interface NormalizedJob {
  /** Stable id: `${source}:${externalId}`. */
  id: string;
  source: string;
  title: string;
  company: string;
  url: string;
  location: string | null;
  remote: boolean;
  tags: string[];
  /** Plain-text description, ready for the analysis pipeline. */
  description: string;
  salary: string | null;
  postedAt: string | null;
}

export interface JobSource {
  readonly name: string;
  search(query: JobSearchQuery): Promise<NormalizedJob[]>;
}

/** GET + JSON with a hard timeout; returns null on any failure (never throws). */
export async function fetchJson<T>(url: string, timeoutMs = 10000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'JobFit-ResumeAI/1.0 (+job-search)', Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A job is relevant when any keyword appears in its title or tags. */
export function matchesKeywords(title: string, tags: string[], keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const haystack = `${title} ${tags.join(' ')}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}
