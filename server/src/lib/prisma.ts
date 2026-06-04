import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { env, isProd } from "../config/env.js";

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProd ? ["error"] : ["query", "warn", "error"],
  });

if (!isProd) globalForPrisma.prisma = prisma;
