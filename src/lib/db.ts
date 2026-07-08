import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma en singleton. En développement, Next.js recharge les modules
 * à chaud ; sans ce cache global on ouvrirait trop de connexions à Postgres.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
