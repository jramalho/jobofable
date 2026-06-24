import { stripHtml } from '../../utils/html';
import { atsBoardsSource } from './atsBoards';
import {
  JobSearchQuery,
  JobSource,
  NormalizedJob,
  fetchJson,
  matchesKeywords,
} from './JobSource';

// --- Remotive (https://remotive.com/api) — supports a search param ----------

interface RemotiveResponse {
  jobs: {
    id: number;
    title: string;
    company_name: string;
    url: string;
    candidate_required_location: string;
    tags: string[];
    description: string;
    salary: string;
    publication_date: string;
  }[];
}

export const remotiveSource: JobSource = {
  name: 'remotive',
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const search = encodeURIComponent(query.keywords.join(' '));
    const data = await fetchJson<RemotiveResponse>(
      `https://remotive.com/api/remote-jobs?search=${search}&limit=${query.limit * 2}`,
    );
    if (!data?.jobs) return [];
    return data.jobs.map((job) => ({
      id: `remotive:${job.id}`,
      source: 'remotive',
      title: job.title,
      company: job.company_name,
      url: job.url,
      location: job.candidate_required_location || null,
      remote: true,
      tags: job.tags ?? [],
      description: stripHtml(job.description ?? ''),
      salary: job.salary || null,
      postedAt: job.publication_date || null,
    }));
  },
};

// --- Arbeitnow (https://www.arbeitnow.com/api) — latest board, filter locally

interface ArbeitnowResponse {
  data: {
    slug: string;
    title: string;
    company_name: string;
    url: string;
    location: string;
    remote: boolean;
    tags: string[];
    description: string;
    created_at: number;
  }[];
}

export const arbeitnowSource: JobSource = {
  name: 'arbeitnow',
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const data = await fetchJson<ArbeitnowResponse>('https://www.arbeitnow.com/api/job-board-api');
    if (!data?.data) return [];
    return data.data
      .filter((job) => matchesKeywords(job.title, job.tags ?? [], query.keywords))
      .filter((job) => !query.remoteOnly || job.remote)
      .map((job) => ({
        id: `arbeitnow:${job.slug}`,
        source: 'arbeitnow',
        title: job.title,
        company: job.company_name,
        url: job.url,
        location: job.location || null,
        remote: Boolean(job.remote),
        tags: job.tags ?? [],
        description: stripHtml(job.description ?? ''),
        salary: null,
        postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
      }));
  },
};

// --- RemoteOK (https://remoteok.com/api) — first element is a legal notice ---

interface RemoteOkJob {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  url?: string;
  apply_url?: string;
  location?: string;
  tags?: string[];
  description?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
}

export const remoteOkSource: JobSource = {
  name: 'remoteok',
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const data = await fetchJson<RemoteOkJob[]>('https://remoteok.com/api');
    if (!Array.isArray(data)) return [];
    return data
      .filter((job) => job.position && job.company)
      .filter((job) => matchesKeywords(job.position ?? '', job.tags ?? [], query.keywords))
      .map((job) => ({
        id: `remoteok:${job.id ?? job.slug}`,
        source: 'remoteok',
        title: job.position ?? '',
        company: job.company ?? '',
        url: job.url ?? job.apply_url ?? `https://remoteok.com/remote-jobs/${job.id ?? ''}`,
        location: job.location || null,
        remote: true,
        tags: job.tags ?? [],
        description: stripHtml(job.description ?? ''),
        salary: salaryRange(job.salary_min, job.salary_max),
        postedAt: job.date || null,
      }));
  },
};

function salaryRange(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  return `$${(min ?? max)!.toLocaleString()}`;
}

const ALL_SOURCES: Record<string, JobSource> = {
  remotive: remotiveSource,
  arbeitnow: arbeitnowSource,
  remoteok: remoteOkSource,
  'ats-boards': atsBoardsSource,
};

/**
 * Enabled sources from `JOB_SOURCES` (comma-separated), defaulting to all.
 * Unknown names are ignored so a typo can't disable the search entirely.
 */
export function createJobSources(): JobSource[] {
  const configured = (process.env.JOB_SOURCES ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  const names = configured.length > 0 ? configured : Object.keys(ALL_SOURCES);
  const sources = names.map((name) => ALL_SOURCES[name]).filter(Boolean);
  return sources.length > 0 ? sources : Object.values(ALL_SOURCES);
}
