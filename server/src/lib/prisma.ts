import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env, isProd } from "../config/env.js";

// Use the standard node-postgres (pg) adapter — connects to Neon over normal
// TCP/TLS. The serverless (@neondatabase/serverless) driver needs WebSockets,
// which a plain Node VPS can't open ("All attempts to open a WebSocket failed").
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is empty — check the server .env file");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProd ? ["error"] : ["query", "warn", "error"],
  });

if (!isProd) globalForPrisma.prisma = prisma;
