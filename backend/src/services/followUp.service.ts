import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  CreateFollowUpBody,
  ListFollowUpsQuery,
  UpdateFollowUpBody,
} from '../schemas/followUp.schema';

const applicationRefSelect = {
  application: { select: { id: true, jobTitle: true, status: true, companyId: true } },
} satisfies Prisma.FollowUpTaskInclude;

export function listFollowUps(filters: ListFollowUpsQuery) {
  const where: Prisma.FollowUpTaskWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.applicationId) where.applicationId = filters.applicationId;

  return prisma.followUpTask.findMany({
    where,
    orderBy: { dueAt: 'asc' },
    include: applicationRefSelect,
  });
}

/** Creates a follow-up under an application, or null when the application is missing. */
export async function createFollowUp(applicationId: string, body: CreateFollowUpBody) {
  const count = await prisma.jobApplication.count({ where: { id: applicationId } });
  if (count === 0) return null;

  return prisma.followUpTask.create({
    data: {
      applicationId,
      title: body.title,
      dueAt: body.dueAt,
      status: body.status ?? 'pending',
    },
  });
}

export async function updateFollowUp(id: string, body: UpdateFollowUpBody) {
  const existing = await prisma.followUpTask.findUnique({ where: { id } });
  if (!existing) return null;

  // Completing a task stamps completedAt automatically unless one was provided.
  let completedAt = body.completedAt;
  if (body.status === 'completed' && body.completedAt === undefined && !existing.completedAt) {
    completedAt = new Date();
  }

  return prisma.followUpTask.update({
    where: { id },
    data: {
      title: body.title,
      dueAt: body.dueAt,
      status: body.status,
      completedAt,
    },
  });
}

export async function deleteFollowUp(id: string): Promise<boolean> {
  const { count } = await prisma.followUpTask.deleteMany({ where: { id } });
  return count > 0;
}
