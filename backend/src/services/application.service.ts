import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  CheckDuplicatesBody,
  CreateApplicationBody,
  UpdateApplicationBody,
} from '../schemas/application.schema';
import { CreateApplicationEventBody } from '../schemas/applicationEvent.schema';
import { addBusinessDays } from '../utils/businessDays';
import { normalizeCompanyName } from '../utils/normalizeCompanyName';
import {
  TITLE_SIMILARITY_THRESHOLD,
  companyNamesMatch,
  jobDescriptionMentionsCompany,
  titleSimilarity,
  urlsLikelySame,
} from '../utils/duplicateMatch';
import { findOrCreateCompanyId } from './company.service';

type Db = Prisma.TransactionClient;

const FOLLOW_UP_BUSINESS_DAYS = 5;
const DEFAULT_FOLLOW_UP_TITLE = 'Follow up on application';

const analysisSummarySelect = {
  id: true,
  companyName: true,
  jobTitle: true,
  matchScore: true,
  createdAt: true,
} satisfies Prisma.AnalysisSelect;

// Document metadata only — the large contentJson is intentionally excluded.
const documentMetaSelect = {
  id: true,
  type: true,
  title: true,
  candidateName: true,
  companyName: true,
  jobTitle: true,
  createdAt: true,
} satisfies Prisma.GeneratedDocumentSelect;

const countSelect = {
  select: { documents: true, followUpTasks: true, events: true, contacts: true },
} satisfies Prisma.JobApplicationCountOutputTypeDefaultArgs;

const listInclude = {
  company: true,
  analysis: { select: analysisSummarySelect },
  followUpTasks: { where: { status: 'pending' }, orderBy: { dueAt: 'asc' }, take: 1 },
  _count: countSelect,
} satisfies Prisma.JobApplicationInclude;

const detailInclude = {
  company: true,
  analysis: { select: analysisSummarySelect },
  events: { orderBy: { occurredAt: 'desc' } },
  contacts: { orderBy: { createdAt: 'desc' } },
  followUpTasks: { orderBy: { dueAt: 'asc' } },
  documents: { select: documentMetaSelect, orderBy: { createdAt: 'desc' } },
  _count: countSelect,
} satisfies Prisma.JobApplicationInclude;

type ListPayload = Prisma.JobApplicationGetPayload<{ include: typeof listInclude }>;
type DetailPayload = Prisma.JobApplicationGetPayload<{ include: typeof detailInclude }>;

function shapeListItem(app: ListPayload) {
  const { company, analysis, followUpTasks, _count, ...fields } = app;
  return {
    ...fields,
    company,
    analysis,
    documentsCount: _count.documents,
    counts: countsOf(_count),
    nextFollowUp: followUpTasks[0] ?? null,
  };
}

function shapeDetail(app: DetailPayload) {
  const { company, analysis, events, contacts, followUpTasks, documents, _count, ...fields } = app;
  return {
    ...fields,
    company,
    analysis,
    events,
    contacts,
    followUpTasks,
    documents,
    documentsCount: _count.documents,
    counts: countsOf(_count),
    nextFollowUp: followUpTasks.find((task) => task.status === 'pending') ?? null,
  };
}

function countsOf(count: ListPayload['_count']) {
  return {
    documents: count.documents,
    followUpTasks: count.followUpTasks,
    events: count.events,
    contacts: count.contacts,
  };
}

export async function listApplications() {
  const apps = await prisma.jobApplication.findMany({
    orderBy: { updatedAt: 'desc' },
    include: listInclude,
  });
  return apps.map(shapeListItem);
}

export async function getApplicationById(id: string) {
  const app = await prisma.jobApplication.findUnique({ where: { id }, include: detailInclude });
  return app ? shapeDetail(app) : null;
}

export async function createApplication(input: CreateApplicationBody) {
  const id = await prisma.$transaction(async (tx) => {
    const companyId = await resolveCompanyId(tx, input.companyName, input.companyId);
    const status = input.status ?? 'saved';
    const becomingApplied = status === 'applied';

    const appliedAt = input.appliedAt ?? (becomingApplied ? new Date() : null);
    let nextFollowUpAt = input.nextFollowUpAt ?? null;
    if (becomingApplied && !nextFollowUpAt) {
      nextFollowUpAt = addBusinessDays(new Date(), FOLLOW_UP_BUSINESS_DAYS);
    }

    const app = await tx.jobApplication.create({
      data: {
        companyId,
        analysisId: input.analysisId ?? null,
        jobTitle: input.jobTitle,
        jobUrl: input.jobUrl ?? null,
        source: input.source ?? null,
        status,
        appliedAt,
        lastContactAt: input.lastContactAt ?? null,
        nextFollowUpAt,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        currency: input.currency ?? null,
        contractType: input.contractType ?? null,
        remoteType: input.remoteType ?? null,
        jobDescription: input.jobDescription ?? null,
        matchScore: input.matchScore ?? null,
        notes: input.notes ?? null,
      },
    });

    await recordEvent(tx, app.id, 'created');
    if (becomingApplied && nextFollowUpAt) {
      await createDefaultFollowUp(tx, app.id, nextFollowUpAt);
    }
    return app.id;
  });

  return getApplicationById(id);
}

/** Updates an application; returns the updated detail, or null when not found. */
export async function updateApplication(id: string, input: UpdateApplicationBody) {
  const found = await prisma.$transaction(async (tx) => {
    const existing = await tx.jobApplication.findUnique({ where: { id } });
    if (!existing) return false;

    const companyId =
      input.companyName !== undefined || input.companyId !== undefined
        ? await resolveCompanyId(tx, input.companyName, input.companyId)
        : existing.companyId;

    const statusChanged = input.status !== undefined && input.status !== existing.status;
    const becomingApplied = statusChanged && input.status === 'applied';

    // On the first transition to "applied", stamp appliedAt and schedule a
    // follow-up unless the caller already supplied those values.
    let appliedAt = input.appliedAt;
    if (becomingApplied && input.appliedAt === undefined && !existing.appliedAt) {
      appliedAt = new Date();
    }

    let nextFollowUpAt = input.nextFollowUpAt;
    let scheduleFollowUp = false;
    if (becomingApplied && input.nextFollowUpAt === undefined && !existing.nextFollowUpAt) {
      nextFollowUpAt = addBusinessDays(new Date(), FOLLOW_UP_BUSINESS_DAYS);
      scheduleFollowUp = true;
    }

    await tx.jobApplication.update({
      where: { id },
      data: {
        companyId,
        analysisId: input.analysisId,
        jobTitle: input.jobTitle,
        jobUrl: input.jobUrl,
        source: input.source,
        status: input.status,
        appliedAt,
        lastContactAt: input.lastContactAt,
        nextFollowUpAt,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        currency: input.currency,
        contractType: input.contractType,
        remoteType: input.remoteType,
        jobDescription: input.jobDescription,
        matchScore: input.matchScore,
        notes: input.notes,
      },
    });

    if (statusChanged) {
      await recordEvent(tx, id, 'status_changed', `${existing.status} → ${input.status}`);
    }
    if (scheduleFollowUp && nextFollowUpAt) {
      await createDefaultFollowUp(tx, id, nextFollowUpAt);
    }
    return true;
  });

  return found ? getApplicationById(id) : null;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const { count } = await prisma.jobApplication.deleteMany({ where: { id } });
  return count > 0;
}

/**
 * Promotes a stored analysis into a tracked application, reusing the company,
 * job title, description and match score already extracted by the pipeline.
 * Idempotent: if an application is already linked to this analysis it is
 * returned as-is (`created: false`) so the action is safe to repeat.
 * Returns null when the analysis id does not exist.
 */
export async function createApplicationFromAnalysis(analysisId: string) {
  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!analysis) return null;

  const existing = await prisma.jobApplication.findFirst({ where: { analysisId } });
  if (existing) {
    return { application: await getApplicationById(existing.id), created: false };
  }

  const application = await createApplication({
    analysisId,
    jobTitle: analysis.jobTitle ?? 'Untitled role',
    companyName: analysis.companyName ?? undefined,
    jobDescription: analysis.jobDescription,
    matchScore: typeof analysis.matchScore === 'number' ? analysis.matchScore : undefined,
    status: 'saved',
  });
  return { application, created: true };
}

// --- Duplicate detection ---------------------------------------------------

export interface DuplicateApplicationMatch {
  id: string;
  companyName: string | null;
  jobTitle: string;
  status: string;
  appliedAt: Date | null;
  jobUrl: string | null;
  matchReason: string;
}

export interface DuplicateCheckResult {
  possibleDuplicateCompany: boolean;
  possibleDuplicateApplications: DuplicateApplicationMatch[];
}

const MAX_DUPLICATE_MATCHES = 8;

/**
 * Deterministic check for whether the user may have already applied to the same
 * company or job. Warnings only — the caller decides what to do. Rules:
 *  - same normalized company name as an existing Company → company-level flag;
 *  - same/very similar job URL → flag;
 *  - same company + similar job title → flag;
 *  - job description mentions an existing company (+ similar title when given).
 */
export async function checkDuplicates(input: CheckDuplicatesBody): Promise<DuplicateCheckResult> {
  const normalizedCompany = input.companyName ? normalizeCompanyName(input.companyName) : '';

  let possibleDuplicateCompany = false;
  if (normalizedCompany) {
    const companies = await prisma.company.findMany({ select: { normalizedName: true } });
    possibleDuplicateCompany = companies.some((company) =>
      companyNamesMatch(normalizedCompany, company.normalizedName),
    );
  }

  const apps = await prisma.jobApplication.findMany({
    include: { company: true },
    orderBy: { updatedAt: 'desc' },
  });

  const matches: DuplicateApplicationMatch[] = [];
  for (const app of apps) {
    const companyName = app.company?.name ?? null;
    const normalizedExisting = companyName ? normalizeCompanyName(companyName) : '';
    const companyMatches = Boolean(
      normalizedCompany && normalizedExisting && companyNamesMatch(normalizedCompany, normalizedExisting),
    );
    const jdMentions = Boolean(
      input.jobDescription && companyName && jobDescriptionMentionsCompany(input.jobDescription, companyName),
    );
    const titleSimilar = titleSimilarity(input.jobTitle, app.jobTitle) >= TITLE_SIMILARITY_THRESHOLD;
    const urlSame = urlsLikelySame(input.jobUrl, app.jobUrl);

    if (jdMentions) possibleDuplicateCompany = true;

    const reasons: string[] = [];
    if (urlSame) reasons.push('Same job posting link');
    if (companyMatches && titleSimilar) {
      reasons.push(`Same company (${companyName}) and a similar role`);
    } else if (companyMatches && !input.jobTitle) {
      reasons.push(`You already track an application at ${companyName}`);
    }
    if (jdMentions && !companyMatches) {
      if (titleSimilar) reasons.push(`This job description mentions ${companyName}, with a similar role`);
      else if (!input.jobTitle) {
        reasons.push(`This job description mentions ${companyName}, which you've already applied to`);
      }
    }

    if (reasons.length > 0) {
      matches.push({
        id: app.id,
        companyName,
        jobTitle: app.jobTitle,
        status: app.status,
        appliedAt: app.appliedAt,
        jobUrl: app.jobUrl,
        matchReason: reasons.join('; '),
      });
    }
    if (matches.length >= MAX_DUPLICATE_MATCHES) break;
  }

  return { possibleDuplicateCompany, possibleDuplicateApplications: matches };
}

// --- Application events ----------------------------------------------------

export async function listApplicationEvents(applicationId: string) {
  if (!(await applicationExists(applicationId))) return null;
  return prisma.applicationEvent.findMany({
    where: { applicationId },
    orderBy: { occurredAt: 'desc' },
  });
}

export async function createApplicationEvent(applicationId: string, body: CreateApplicationEventBody) {
  if (!(await applicationExists(applicationId))) return null;
  return prisma.applicationEvent.create({
    data: {
      applicationId,
      type: body.type,
      notes: body.notes ?? null,
      occurredAt: body.occurredAt ?? new Date(),
    },
  });
}

// --- helpers ---------------------------------------------------------------

async function resolveCompanyId(
  tx: Db,
  companyName?: string,
  companyId?: string,
): Promise<string | null> {
  if (companyName) return findOrCreateCompanyId(tx, companyName);
  return companyId ?? null;
}

function recordEvent(tx: Db, applicationId: string, type: string, notes?: string) {
  return tx.applicationEvent.create({
    data: { applicationId, type, notes: notes ?? null, occurredAt: new Date() },
  });
}

function createDefaultFollowUp(tx: Db, applicationId: string, dueAt: Date) {
  return tx.followUpTask.create({
    data: { applicationId, title: DEFAULT_FOLLOW_UP_TITLE, dueAt, status: 'pending' },
  });
}

async function applicationExists(id: string): Promise<boolean> {
  const count = await prisma.jobApplication.count({ where: { id } });
  return count > 0;
}
