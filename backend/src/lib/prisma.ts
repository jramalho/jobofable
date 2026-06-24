import { PrismaClient } from '@prisma/client';

/**
 * Single shared PrismaClient for the whole backend. A module-level singleton
 * (cached on globalThis in dev) prevents `tsx watch` hot-reloads from opening a
 * new connection pool on every restart.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
