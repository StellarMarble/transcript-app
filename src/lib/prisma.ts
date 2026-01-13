import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization to avoid build-time errors
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

// Export a proxy that lazily initializes the client on first use
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
