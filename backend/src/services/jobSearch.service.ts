import { prisma } from '../lib/prisma';
import { createJobSources } from '../providers/jobs/sources';
import { JobSearchQuery, NormalizedJob } from '../providers/jobs/JobSource';
import {
  companyNamesMatch,
  normalizeTitle,
  titleSimilarity,
  urlsLikelySame,
} from '../utils/duplicateMatch';
import { normalizeCompanyName } from '../utils/normalizeCompanyName';

export interface JobSearchResult {
  jobs: NormalizedJob[];
  totalFound: number;
  /** How many results were dropped because they're already in the tracker. */
  alreadyTracked: number;
  sources: string[];
}

/**
 * Searches all enabled job sources, de-duplicates, and removes anything already
 * in the application tracker (Kanban) — so the user only sees jobs left to act
 * on. Reuses the same company/title/URL matching as duplicate detection.
 */
export async function searchUntrackedJobs(query: JobSearchQuery): Promise<JobSearchResult> {
  const sources = createJobSources();
  const settled = await Promise.allSettled(sources.map((source) => source.search(query)));
  const found = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));

  const deduped = dedupeJobs(found);

  const apps = await prisma.jobApplication.findMany({
    include: { company: { select: { name: true } } },
  });
  const tracked = apps.map((app) => ({
    url: app.jobUrl,
    company: app.company?.name ?? null,
    title: app.jobTitle,
  }));

  const untracked = deduped.filter((job) => !isAlreadyTracked(job, tracked));

  const ranked = rankByRelevance(untracked, query.keywords).slice(0, query.limit);

  return {
    jobs: ranked,
    totalFound: deduped.length,
    alreadyTracked: deduped.length - untracked.length,
    sources: sources.map((source) => source.name),
  };
}

interface TrackedRef {
  url: string | null;
  company: string | null;
  title: string;
}

function isAlreadyTracked(job: NormalizedJob, tracked: TrackedRef[]): boolean {
  const jobCompany = normalizeCompanyName(job.company);
  return tracked.some((ref) => {
    if (urlsLikelySame(job.url, ref.url)) return true;
    if (!ref.company) return false;
    const sameCompany = companyNamesMatch(jobCompany, normalizeCompanyName(ref.company));
    return sameCompany && titleSimilarity(job.title, ref.title) >= 0.6;
  });
}

/** Drops duplicates across sources by URL and by company + normalized title. */
function dedupeJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of jobs) {
    const urlKey = job.url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
    const idKey = `${normalizeCompanyName(job.company)}|${normalizeTitle(job.title)}`;
    if (seen.has(urlKey) || seen.has(idKey)) continue;
    seen.add(urlKey);
    seen.add(idKey);
    out.push(job);
  }
  return out;
}

/**
 * Ranks by keyword relevance, then recency. Title/tag hits weigh more than
 * description hits, but description still counts so company-board jobs (whose
 * tech terms live in the description, not the title) aren't buried.
 */
function rankByRelevance(jobs: NormalizedJob[], keywords: string[]): NormalizedJob[] {
  const lowered = keywords.map((keyword) => keyword.toLowerCase());
  const score = (job: NormalizedJob): number => {
    const prominent = `${job.title} ${job.tags.join(' ')}`.toLowerCase();
    const body = job.description.toLowerCase();
    return lowered.reduce((total, keyword) => {
      if (prominent.includes(keyword)) return total + 2;
      if (body.includes(keyword)) return total + 1;
      return total;
    }, 0);
  };
  return [...jobs].sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (b.postedAt ?? '').localeCompare(a.postedAt ?? '');
  });
}
