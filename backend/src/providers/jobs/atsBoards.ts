import { stripHtml } from '../../utils/html';
import { JobSearchQuery, JobSource, NormalizedJob, fetchJson } from './JobSource';

/**
 * Job source backed by companies' own public ATS board APIs (Greenhouse, Lever,
 * Ashby). No API key — these endpoints power the companies' public job pages.
 * Each company is one request; the list is curated (verified to respond) and
 * can be overridden via ATS_COMPANIES ("greenhouse:airbnb:Airbnb,ashby:ramp:Ramp").
 */
interface Company {
  ats: 'greenhouse' | 'lever' | 'ashby';
  slug: string;
  name: string;
}

const DEFAULT_COMPANIES: Company[] = [
  { ats: 'greenhouse', slug: 'airbnb', name: 'Airbnb' },
  { ats: 'greenhouse', slug: 'stripe', name: 'Stripe' },
  { ats: 'greenhouse', slug: 'figma', name: 'Figma' },
  { ats: 'greenhouse', slug: 'cloudflare', name: 'Cloudflare' },
  { ats: 'greenhouse', slug: 'gitlab', name: 'GitLab' },
  { ats: 'greenhouse', slug: 'discord', name: 'Discord' },
  { ats: 'lever', slug: 'spotify', name: 'Spotify' },
  { ats: 'ashby', slug: 'ramp', name: 'Ramp' },
  { ats: 'ashby', slug: 'notion', name: 'Notion' },
  { ats: 'ashby', slug: 'linear', name: 'Linear' },
  { ats: 'ashby', slug: 'vanta', name: 'Vanta' },
  { ats: 'ashby', slug: 'openai', name: 'OpenAI' },
];

const PER_COMPANY_CAP = 6;

export const atsBoardsSource: JobSource = {
  name: 'ats-boards',
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const companies = parseCompanies();
    const settled = await Promise.allSettled(companies.map((company) => fetchCompany(company)));
    const jobs = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));

    // These boards return every role, so keyword filtering happens here (over
    // title + tags + description, since tech terms live in the description).
    return companies.flatMap((company) => {
      const matches = jobs
        .filter((job) => job.source === `ats:${company.slug}`)
        .filter((job) => !query.remoteOnly || job.remote)
        .filter((job) => relevant(job, query.keywords))
        .slice(0, PER_COMPANY_CAP);
      // Replace the internal grouping tag with a clean source label.
      return matches.map((job) => ({ ...job, source: company.ats }));
    });
  },
};

function relevant(job: NormalizedJob, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const haystack = `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

async function fetchCompany(company: Company): Promise<NormalizedJob[]> {
  if (company.ats === 'greenhouse') return fetchGreenhouse(company);
  if (company.ats === 'lever') return fetchLever(company);
  return fetchAshby(company);
}

interface GreenhouseResponse {
  jobs: {
    id: number;
    title: string;
    absolute_url: string;
    location: { name: string } | null;
    content: string;
    updated_at: string;
    departments?: { name: string }[];
  }[];
}

async function fetchGreenhouse(company: Company): Promise<NormalizedJob[]> {
  const data = await fetchJson<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`,
    12000,
  );
  if (!data?.jobs) return [];
  return data.jobs.map((job) => {
    const location = job.location?.name?.trim() || null;
    return job2normalized(company, {
      externalId: String(job.id),
      title: job.title,
      url: job.absolute_url,
      location,
      remote: /remote/i.test(location ?? ''),
      tags: (job.departments ?? []).map((d) => d.name),
      description: stripHtml(job.content ?? ''),
      postedAt: job.updated_at || null,
    });
  });
}

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: { location?: string; department?: string; team?: string };
  descriptionPlain?: string;
  workplaceType?: string;
  createdAt?: number;
}

async function fetchLever(company: Company): Promise<NormalizedJob[]> {
  const data = await fetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${company.slug}?mode=json`,
    12000,
  );
  if (!Array.isArray(data)) return [];
  return data.map((job) => {
    const location = job.categories?.location ?? null;
    return job2normalized(company, {
      externalId: job.id,
      title: job.text,
      url: job.hostedUrl,
      location,
      remote: job.workplaceType === 'remote' || /remote/i.test(location ?? ''),
      tags: [job.categories?.department, job.categories?.team].filter(Boolean) as string[],
      description: job.descriptionPlain ?? '',
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    });
  });
}

interface AshbyResponse {
  jobs: {
    id: string;
    title: string;
    jobUrl: string;
    location: string | null;
    descriptionPlain?: string;
    isRemote?: boolean;
    department?: string;
    team?: string;
    publishedAt?: string;
  }[];
}

async function fetchAshby(company: Company): Promise<NormalizedJob[]> {
  const data = await fetchJson<AshbyResponse>(
    `https://api.ashbyhq.com/posting-api/job-board/${company.slug}`,
    12000,
  );
  if (!data?.jobs) return [];
  return data.jobs.map((job) =>
    job2normalized(company, {
      externalId: job.id,
      title: job.title.trim(),
      url: job.jobUrl,
      location: job.location ?? null,
      remote: Boolean(job.isRemote) || /remote/i.test(job.location ?? ''),
      tags: [job.department, job.team].filter(Boolean) as string[],
      description: job.descriptionPlain ?? '',
      postedAt: job.publishedAt ?? null,
    }),
  );
}

function job2normalized(
  company: Company,
  fields: {
    externalId: string;
    title: string;
    url: string;
    location: string | null;
    remote: boolean;
    tags: string[];
    description: string;
    postedAt: string | null;
  },
): NormalizedJob {
  return {
    id: `${company.ats}:${company.slug}:${fields.externalId}`,
    // Tag with the company slug so search() can apply the per-company cap.
    source: `ats:${company.slug}`,
    title: fields.title,
    company: company.name,
    url: fields.url,
    location: fields.location,
    remote: fields.remote,
    tags: fields.tags,
    description: fields.description,
    salary: null,
    postedAt: fields.postedAt,
  };
}

function parseCompanies(): Company[] {
  const raw = process.env.ATS_COMPANIES?.trim();
  if (!raw) return DEFAULT_COMPANIES;
  const parsed = raw
    .split(',')
    .map((entry) => entry.split(':').map((part) => part.trim()))
    .filter(([ats, slug]) => (ats === 'greenhouse' || ats === 'lever' || ats === 'ashby') && slug)
    .map(([ats, slug, name]) => ({ ats, slug, name: name || slug } as Company));
  return parsed.length > 0 ? parsed : DEFAULT_COMPANIES;
}
