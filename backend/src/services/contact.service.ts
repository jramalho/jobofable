import { prisma } from '../lib/prisma';
import { CreateContactBody, UpdateContactBody } from '../schemas/contact.schema';

/** Creates a contact under an application, inheriting its company. Null if the app is missing. */
export async function createContact(applicationId: string, body: CreateContactBody) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, companyId: true },
  });
  if (!application) return null;

  return prisma.contact.create({
    data: {
      applicationId,
      companyId: application.companyId,
      name: body.name,
      role: body.role ?? null,
      email: body.email ?? null,
      linkedInUrl: body.linkedInUrl ?? null,
      notes: body.notes ?? null,
    },
  });
}

/** Lists an application's contacts, or null when the application is missing. */
export async function listContacts(applicationId: string) {
  const count = await prisma.jobApplication.count({ where: { id: applicationId } });
  if (count === 0) return null;
  return prisma.contact.findMany({ where: { applicationId }, orderBy: { createdAt: 'desc' } });
}

export async function updateContact(id: string, body: UpdateContactBody) {
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.contact.update({ where: { id }, data: body });
}

export async function deleteContact(id: string): Promise<boolean> {
  const { count } = await prisma.contact.deleteMany({ where: { id } });
  return count > 0;
}
