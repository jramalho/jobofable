import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { AnalysisResponse } from './analysis.service';

/**
 * Persistence for generated analyses. Kept separate from `analysis.service.ts`
 * (which runs the AI pipeline) so the pipeline stays storage-agnostic and the
 * controller decides when to persist. Saving is best-effort from the caller's
 * point of view — a storage failure must never discard a generated result.
 */

export interface SaveAnalysisInput {
  jobDescription: string;
  result: AnalysisResponse;
}

/** Persists a generated analysis and returns its database id. */
export async function saveAnalysis({ jobDescription, result }: SaveAnalysisInput): Promise<string> {
  const created = await prisma.analysis.create({
    data: {
      jobDescription,
      // Safely extracted from the response; null when the pipeline didn't find them.
      companyName: result.job?.companyName ?? null,
      jobTitle: result.job?.title ?? null,
      matchScore: normalizeScore(result.matchScore),
      rawResultJson: JSON.stringify(result),
      profileJson: result.profile ? JSON.stringify(result.profile) : null,
    },
    select: { id: true },
  });
  return created.id;
}

export interface AnalysisListItem {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  matchScore: number | null;
  createdAt: Date;
}

/** History list, newest first — lightweight columns only. */
export function listAnalyses(): Promise<AnalysisListItem[]> {
  return prisma.analysis.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, companyName: true, jobTitle: true, matchScore: true, createdAt: true },
  });
}

export interface StoredAnalysis {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  matchScore: number | null;
  jobDescription: string;
  createdAt: Date;
  updatedAt: Date;
  /** The full structured response that was returned to the client originally. */
  result: unknown;
  /** The cached resume profile, if the pipeline produced one. */
  profile: unknown;
}

/** Full stored record (parsed JSON) plus metadata, or null when not found. */
export async function getAnalysisById(id: string): Promise<StoredAnalysis | null> {
  const record = await prisma.analysis.findUnique({ where: { id } });
  if (!record) return null;

  return {
    id: record.id,
    companyName: record.companyName,
    jobTitle: record.jobTitle,
    matchScore: record.matchScore,
    jobDescription: record.jobDescription,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    result: parseJson(record.rawResultJson, 'rawResultJson'),
    profile: record.profileJson ? parseJson(record.profileJson, 'profileJson') : null,
  };
}

/** Deletes a stored analysis. Returns false when no row matched the id. */
export async function deleteAnalysis(id: string): Promise<boolean> {
  // `deleteMany` deletes-if-exists and reports the count, avoiding the throw
  // (and noisy Prisma error log) that `delete` raises on a missing record.
  const { count } = await prisma.analysis.deleteMany({ where: { id } });
  return count > 0;
}

function normalizeScore(score: unknown): number | null {
  return typeof score === 'number' && Number.isFinite(score) ? Math.round(score) : null;
}

function parseJson(value: string, field: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError(`Stored analysis ${field} is corrupted and could not be parsed.`, 500);
  }
}
