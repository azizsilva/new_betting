import type { User } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { signHmacSha256Hex } from "../lib/hmac.js";
import { AppError, BadRequest } from "../lib/errors.js";

// ─── Types mirroring the Gamble Hub API ───────────────────────────────────────

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; login: string; role: string };
}

export interface GambleHubGame {
  id: string;
  isEnabled: boolean;
  title: string;
  imageUrl: string;
  provider: string;
}

interface OpenGameResponse {
  status: "success" | "fail";
  error?: string;
  code?: number;
  message?: string;
  content?: {
    game?: { url?: string };
    gameRes?: { sessionId?: string };
  };
}

// ─── Token cache (in-memory, single process) ──────────────────────────────────

let tokenCache: { accessToken: string; expiresAt: number } | null = null;
let resolvedUserId: string | null = null; // captured from the login response
const TOKEN_TTL_MS = 10 * 60 * 1000; // access token is short-lived; re-login defensively

function officeUrl(path: string) {
  return `${env.GAMBLEHUB_OFFICE_URL.replace(/\/$/, "")}${path}`;
}
function clientUrl(path: string) {
  return `${env.GAMBLEHUB_CLIENT_URL.replace(/\/$/, "")}${path}`;
}

function assertConfigured() {
  // user_id comes back from the login response, so only login+password are required.
  if (!env.GAMBLEHUB_LOGIN || !env.GAMBLEHUB_PASSWORD) {
    throw new AppError(503, "Gamble Hub is not configured", "GAMBLEHUB_DISABLED");
  }
}

/** The API user id: env override if set, otherwise captured from login. */
function userId(): string {
  const id = env.GAMBLEHUB_USER_ID || resolvedUserId;
  if (!id) throw new AppError(502, "Gamble Hub user id unavailable (login first)", "GAMBLEHUB_USER_ID");
  return id;
}

/** POST /auth/login (form-encoded). Caches the access token + user id in memory. */
async function login(): Promise<string> {
  assertConfigured();
  const body = new URLSearchParams({
    login: env.GAMBLEHUB_LOGIN,
    password: env.GAMBLEHUB_PASSWORD,
  });
  const res = await fetch(officeUrl("/auth/login"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error(
      { status: res.status, url: officeUrl("/auth/login"), body: text.slice(0, 300) },
      "GambleHub login failed",
    );
    throw new AppError(502, `Gamble Hub login failed (${res.status})`, "GAMBLEHUB_LOGIN", text.slice(0, 200));
  }
  const data = (await res.json()) as LoginResponse;
  tokenCache = { accessToken: data.accessToken, expiresAt: Date.now() + TOKEN_TTL_MS };
  if (data.user?.id) resolvedUserId = data.user.id; // capture for catalog + openGame
  logger.info({ userId: resolvedUserId, hasToken: !!data.accessToken }, "GambleHub login ok");
  return data.accessToken;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }
  return login();
}

/** GET the player game catalog for a currency. Retries once on 401. */
export async function getUserGames(currency: string): Promise<GambleHubGame[]> {
  assertConfigured();

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(attempt > 0);
    // userId() resolves only after login has populated it (or via env override).
    const path = `/users/${userId()}/getUserGames/${currency}`;
    const res = await fetch(officeUrl(path), {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
    if (res.status === 401 && attempt === 0) {
      tokenCache = null;
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      logger.error(
        { status: res.status, url: officeUrl(path), body: text.slice(0, 300) },
        "GambleHub catalog failed",
      );
      throw new AppError(502, `Gamble Hub catalog failed (${res.status})`, "GAMBLEHUB_CATALOG", text.slice(0, 200));
    }
    return (await res.json()) as GambleHubGame[];
  }
  throw new AppError(502, "Gamble Hub catalog unauthorized after retry", "GAMBLEHUB_CATALOG");
}

export interface OpenGameParams {
  user: Pick<User, "id" | "username">;
  gameId: string;
  currency: string;
  language?: string;
  demo?: boolean;
  exitUrl: string;
}

export interface OpenGameResult {
  url: string;
  sessionId: string;
}

/**
 * Open a real (or demo) game session. Signs the request body with HMAC-SHA256,
 * then persists a GameSession so seamless wallet callbacks can resolve the player.
 * openGame requires NO Authorization header (doc §5.1) — only the X-Signature.
 */
export async function openGame(params: OpenGameParams): Promise<OpenGameResult> {
  assertConfigured();
  if (!env.GAMBLEHUB_SECRET) {
    throw new AppError(503, "Gamble Hub signing secret is not configured", "GAMBLEHUB_DISABLED");
  }

  // Ensure we have the API user_id. openGame itself needs no auth, but the id is
  // captured from login — so log in if we don't have it yet (no env override).
  if (!env.GAMBLEHUB_USER_ID && !resolvedUserId) await getToken();

  // login the provider expects is the per-player identifier we'll match in callbacks.
  const playerLogin = params.user.username;

  const payload: Record<string, string> = {
    currency: params.currency,
    demo: params.demo ? "1" : "0",
    exitUrl: params.exitUrl,
    gameId: params.gameId,
    language: params.language ?? "en",
    player_login: playerLogin,
    user_id: userId(),
  };
  if (env.GAMBLEHUB_CALLBACK_URL) payload.callbackUrl = env.GAMBLEHUB_CALLBACK_URL;

  // Sign the EXACT bytes we send (doc §7: byte-for-byte).
  const rawBody = JSON.stringify(payload);
  const signature = signHmacSha256Hex(rawBody, env.GAMBLEHUB_SECRET);

  const res = await fetch(clientUrl("/games/openGame"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-signature": signature,
    },
    body: rawBody,
  });

  const data = (await res.json().catch(() => ({}))) as OpenGameResponse;

  if (!res.ok || data.status !== "success") {
    const msg = data.message || data.error || `Gamble Hub openGame failed (${res.status})`;
    logger.warn({ gameId: params.gameId, status: res.status, error: data.error, msg }, "openGame failed");
    throw BadRequest(msg);
  }

  const url = data.content?.game?.url;
  const sessionId = data.content?.gameRes?.sessionId;
  if (!url || !sessionId) {
    throw new AppError(502, "Gamble Hub openGame returned no url/sessionId", "GAMBLEHUB_OPEN");
  }

  // Persist the session → maps provider sessionId/login back to our user + currency.
  await prisma.gameSession.upsert({
    where: { sessionId },
    create: {
      sessionId,
      userId: params.user.id,
      login: playerLogin,
      currency: params.currency,
      gameId: params.gameId,
    },
    update: { userId: params.user.id, login: playerLogin, currency: params.currency, gameId: params.gameId },
  });

  return { url, sessionId };
}
