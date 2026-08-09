import { PrismaClient } from "@prisma/client";

// Singleton de Prisma Client — evita agotar conexiones en dev por hot-reload
// del App Router (patrón recomendado por Prisma para Next.js).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
