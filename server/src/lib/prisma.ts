import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { env, isProd } from "../config/env.js";

// `env` is validated in config/env.ts (which loads .env by absolute path), so
// DATABASE_URL is guaranteed present here. Read from the validated env, not
// process.env, to avoid empty-connection-string adapter errors.
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is empty — check the server .env file");
}

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProd ? ["error"] : ["query", "warn", "error"],
  });

if (!isProd) globalForPrisma.prisma = prisma;
