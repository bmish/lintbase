import { PrismaClient } from '@prisma/client';
import { env } from '@/env.mjs';

function getClient() {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof getClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? getClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
