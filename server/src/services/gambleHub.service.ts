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
    // GambleHub may use gameRes or gameSession, sessionId or session_id
    gameRes?: { sessionId?: string; session_id?: string };
    gameSession?: { sessionId?: string; session_id?: string };
  };
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
// Gamble Hub splits slots and live casino across two operator accounts. Each has
// its own credentials, signing secret, access-token cache, and resolved user_id.

export type AccountKind = "slots" | "live";

interface Account {
  kind: AccountKind;
  login: string;
  password: string;
  secret: string;
  envUserId: string;
  token: { accessToken: string; expiresAt: number } | null;
  resolvedUserId: string | null;
  loginInFlight: Promise<string> | null; // de-dupe concurrent logins
}

const TOKEN_TTL_MS = 10 * 60 * 1000;

const slots: Account = {
  kind: "slots",
  login: env.GAMBLEHUB_LOGIN,
  password: env.GAMBLEHUB_PASSWORD,
  secret: env.GAMBLEHUB_SECRET,
  envUserId: env.GAMBLEHUB_USER_ID,
  token: null,
  resolvedUserId: null,
  loginInFlight: null,
};

// Live account falls back to the slots account if its own creds aren't set.
const live: Account = {
  kind: "live",
  login: env.GAMBLEHUB_LIVE_LOGIN || env.GAMBLEHUB_LOGIN,
  password: env.GAMBLEHUB_LIVE_PASSWORD || env.GAMBLEHUB_PASSWORD,
  secret: env.GAMBLEHUB_LIVE_SECRET || env.GAMBLEHUB_SECRET,
  envUserId: env.GAMBLEHUB_LIVE_USER_ID || env.GAMBLEHUB_USER_ID,
  token: null,
  resolvedUserId: null,
  loginInFlight: null,
};

function accountFor(kind: AccountKind): Account {
  return kind === "live" ? live : slots;
}

function officeUrl(path: string) {
  return `${env.GAMBLEHUB_OFFICE_URL.replace(/\/$/, "")}${path}`;
}
function clientUrl(path: string) {
  return `${env.GAMBLEHUB_CLIENT_URL.replace(/\/$/, "")}${path}`;
}

// fetch with a hard timeout so a slow/hanging provider returns a clean error
// instead of holding the request open until nginx 502s.
async function fetchT(url: string, init: RequestInit, timeoutMs = 12_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function assertConfigured(acc: Account) {
  if (!acc.login || !acc.password) {
    throw new AppError(503, `Gamble Hub (${acc.kind}) is not configured`, "GAMBLEHUB_DISABLED");
  }
}

function userId(acc: Account): string {
  const id = acc.envUserId || acc.resolvedUserId;
  if (!id) throw new AppError(502, "Gamble Hub user id unavailable (login first)", "GAMBLEHUB_USER_ID");
  return id;
}

/** POST /auth/login (form-encoded). Caches the access token + user id per account. */
async function login(acc: Account): Promise<string> {
  assertConfigured(acc);
  const body = new URLSearchParams({ login: acc.login, password: acc.password });
  const res = await fetchT(officeUrl("/auth/login"), {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error({ account: acc.kind, status: res.status, body: text.slice(0, 300) }, "GambleHub login failed");
    throw new AppError(502, `Gamble Hub login failed (${res.status})`, "GAMBLEHUB_LOGIN", text.slice(0, 200));
  }
  const data = (await res.json()) as LoginResponse;
  acc.token = { accessToken: data.accessToken, expiresAt: Date.now() + TOKEN_TTL_MS };
  if (data.user?.id) acc.resolvedUserId = data.user.id;
  logger.info({ account: acc.kind, userId: acc.resolvedUserId }, "GambleHub login ok");
  return data.accessToken;
}

// Concurrency-safe token getter: collapses simultaneous logins into one request.
async function getToken(acc: Account, forceRefresh = false): Promise<string> {
  if (!forceRefresh && acc.token && acc.token.expiresAt > Date.now()) return acc.token.accessToken;
  if (acc.loginInFlight) return acc.loginInFlight;
  acc.loginInFlight = login(acc).finally(() => {
    acc.loginInFlight = null;
  });
  return acc.loginInFlight;
}

/** GET the player game catalog for a currency on a given account. Retries once on 401. */
export async function getUserGames(currency: string, kind: AccountKind = "slots"): Promise<GambleHubGame[]> {
  const acc = accountFor(kind);
  assertConfigured(acc);

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(acc, attempt > 0);
    const path = `/users/${userId(acc)}/getUserGames/${currency}`;
    const res = await fetchT(officeUrl(path), {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
    if (res.status === 401 && attempt === 0) {
      acc.token = null;
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      logger.error({ account: acc.kind, status: res.status, body: text.slice(0, 300) }, "GambleHub catalog failed");
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
  kind?: AccountKind; // which operator account signs/opens this game
}

export interface OpenGameResult {
  url: string;
  sessionId: string;
}

/**
 * Open a real (or demo) game session on the given account. Signs the request body
 * with that account's HMAC secret, then persists a GameSession so seamless wallet
 * callbacks can resolve the player. openGame needs NO Authorization header (§5.1).
 */
export async function openGame(params: OpenGameParams): Promise<OpenGameResult> {
  const acc = accountFor(params.kind ?? "slots");
  assertConfigured(acc);
  if (!acc.secret) {
    throw new AppError(503, `Gamble Hub (${acc.kind}) signing secret is not configured`, "GAMBLEHUB_DISABLED");
  }

  // Ensure we have the API user_id (captured from login) before signing.
  if (!acc.envUserId && !acc.resolvedUserId) await getToken(acc);

  // GambleHub requires player_login to be alphanumeric + underscores only.
  // Append the numeric user id so two users whose names strip to the same
  // string never share a login key on the provider side.
  const playerLogin = `${params.user.username.replace(/[^a-zA-Z0-9_]/g, "_")}_${params.user.id}`;

  const payload: Record<string, string> = {
    currency: params.currency,
    demo: params.demo ? "1" : "0",
    exitUrl: params.exitUrl,
    gameId: params.gameId,
    language: params.language ?? "en",
    player_login: playerLogin,
    user_id: userId(acc),
  };
  // Always include callbackUrl so GambleHub knows where to POST balance callbacks.
  // Without this the panel default is used — which may point to a stale URL.
  const callbackUrl = env.GAMBLEHUB_CALLBACK_URL;
  if (callbackUrl) payload.callbackUrl = callbackUrl;

  // Sign the EXACT bytes we send (doc §7: byte-for-byte) with this account's secret.
  const rawBody = JSON.stringify(payload);
  const signature = signHmacSha256Hex(rawBody, acc.secret);

  let res: Response;
  let rawText: string;
  try {
    res = await fetchT(clientUrl("/games/openGame"), {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "x-signature": signature },
      body: rawBody,
    });
    rawText = await res.text();
  } catch (err) {
    logger.error({ account: acc.kind, gameId: params.gameId, err: (err as Error).message }, "openGame network error");
    throw BadRequest("Could not reach the game provider. Please try again.");
  }

  let data: OpenGameResponse = {} as OpenGameResponse;
  try {
    data = JSON.parse(rawText) as OpenGameResponse;
  } catch {
    logger.error({ account: acc.kind, gameId: params.gameId, status: res.status, body: rawText.slice(0, 200) }, "openGame non-JSON response");
    throw BadRequest("Game provider returned an unexpected response.");
  }

  if (!res.ok || data.status !== "success") {
    const msg = data.message || data.error || `Game could not be opened (${res.status})`;
    logger.warn({ account: acc.kind, gameId: params.gameId, status: res.status, error: data.error, msg }, "openGame failed");
    throw BadRequest(msg);
  }

  const url = data.content?.game?.url;
  // GambleHub may return sessionId under different keys — try all known variants.
  const gameResObj = data.content?.gameRes ?? data.content?.gameSession;
  const sessionId = gameResObj?.sessionId ?? gameResObj?.session_id;

  // Log the full raw response so we can inspect the exact shape in pm2 logs.
  logger.info({ account: acc.kind, gameId: params.gameId, url: url?.slice(0, 60), sessionId, rawContent: JSON.stringify(data.content).slice(0, 300) }, "openGame raw response");

  if (!url || !sessionId) {
    logger.warn({ account: acc.kind, gameId: params.gameId, data }, "openGame missing url/sessionId");
    throw BadRequest("Game session could not be created.");
  }

  // Persist the session → maps provider sessionId/login back to our user + currency.
  // Never let a logging-table write failure break the launch.
  try {
    await prisma.gameSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: params.user.id,
        login: playerLogin.slice(0, 100),
        currency: params.currency,
        gameId: params.gameId.slice(0, 100),
      },
      update: { userId: params.user.id, login: playerLogin.slice(0, 100), currency: params.currency },
    });
  } catch (err) {
    logger.error({ sessionId, err: (err as Error).message }, "gameSession upsert failed");
  }

  return { url, sessionId };
}
