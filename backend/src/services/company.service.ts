import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateCompanyBody, UpdateCompanyBody } from '../schemas/company.schema';
import { normalizeCompanyName } from '../utils/normalizeCompanyName';

/** A Prisma client or interactive-transaction client. */
type Db = Prisma.TransactionClient | typeof prisma;

const companyWithCounts = {
  include: { _count: { select: { applications: true, contacts: true } } },
} satisfies Prisma.CompanyDefaultArgs;

export function listCompanies() {
  return prisma.company.findMany({ orderBy: { name: 'asc' }, ...companyWithCounts });
}

export function getCompanyById(id: string) {
  return prisma.company.findUnique({ where: { id }, ...companyWithCounts });
}

export function createCompany(data: CreateCompanyBody) {
  return prisma.company.create({
    data: { ...data, normalizedName: normalizeCompanyName(data.name) },
  });
}

/** Updates a company; recomputes the identity key when the name changes. Null if not found. */
export async function updateCompany(id: string, data: UpdateCompanyBody) {
  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.company.update({
    where: { id },
    data: {
      ...data,
      ...(data.name ? { normalizedName: normalizeCompanyName(data.name) } : {}),
    },
  });
}

/** Returns true when a row was deleted, false when the id did not exist. */
export async function deleteCompany(id: string): Promise<boolean> {
  const { count } = await prisma.company.deleteMany({ where: { id } });
  return count > 0;
}

/**
 * Resolves a company id from a (possibly new) company name, de-duplicating by
 * normalized name. Runs against the provided client so it can join a wider
 * transaction (e.g. creating an application + its company atomically).
 */
export async function findOrCreateCompanyId(db: Db, name: string): Promise<string> {
  const normalizedName = normalizeCompanyName(name);
  const existing = await db.company.findFirst({ where: { normalizedName } });
  if (existing) return existing.id;

  const created = await db.company.create({ data: { name: name.trim(), normalizedName } });
  return created.id;
}
