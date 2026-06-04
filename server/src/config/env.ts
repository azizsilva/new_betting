import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env from the server package root regardless of the process cwd
// (pm2 / different launch dirs). dist/config/env.js → ../../.env
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });
// Fallback: also try the cwd (dev with tsx).
dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  COOKIE_DOMAIN: z.string().default("localhost"),

  IGAMING_API_BASE_URL: z.string().optional().default(""),
  IGAMING_API_KEY: z.string().optional().default(""),
  IGAMING_OPERATOR_ID: z.string().optional().default(""),
  GAMBLY_API_BASE_URL: z.string().optional().default(""),
  GAMBLY_API_KEY: z.string().optional().default(""),

  PSP_API_BASE_URL: z.string().optional().default(""),
  PSP_API_KEY: z.string().optional().default(""),
  PSP_WEBHOOK_SECRET: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
