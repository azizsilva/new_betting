import type { User } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { AppError, BadRequest } from "../lib/errors.js";

// ─── iGamingAPI integration ───────────────────────────────────────────────────
// Panel: https://igamingapis.com
// Game list:  GET  https://igamingapis.com/vuejs/api/games-list.php?page=N&limit=N
// Game launch: POST https://igamingapis.live/api/v1/launch-game
//   Body: { token, secret, game_uid, user_id, balance, currency, return_url, callback_url, lang }
// Callback (seamless wallet): POST from provider → our /api/casino/callback
//   Fields: { action, user_id, balance, bet_amount, win_amount, transaction_id, game_uid, currency }

const PANEL_BASE = "https://igamingapis.com/vuejs/api";
const API_BASE   = "https://igamingapis.live/api/v1";

// ─── Game catalog types ───────────────────────────────────────────────────────

export interface IGamingAPIGame {
  id: number;
  game_name: string;
  category: string;
  game_img: string;
  brand_id: number;
  brand_title: string;
}

interface GamesListResponse {
  success: boolean;
  data: {
    games: IGamingAPIGame[];
    pagination: { current_page: number; total_pages: number; total_records: number };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchT(url: string, init: RequestInit, timeoutMs = 15_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function token() {
  const t = env.IGAMINGAPI_LOGIN; // Token from Settings panel
  if (!t) throw new AppError(503, "iGamingAPI token is not configured", "IGAMINGAPI_DISABLED");
  return t;
}

function secret() {
  return env.IGAMINGAPI_SECRET; // Secret from Settings panel
}

// ─── Game catalog (paginated, fetch all pages) ────────────────────────────────

export async function getUserGames(): Promise<IGamingAPIGame[]> {
  const all: IGamingAPIGame[] = [];
  let page = 1;
  const limit = 100;
  let totalPages = 1;

  logger.info("iGamingAPI: fetching game catalog");

  while (page <= totalPages && page <= 100) { // cap at 100 pages = 10,000 games
    const url = `${PANEL_BASE}/games-list.php?page=${page}&limit=${limit}`;

    const res = await fetchT(url, {
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, page, body: text.slice(0, 300) }, "iGamingAPI catalog page failed");
      break;
    }

    const json = (await res.json()) as GamesListResponse;
    if (!json.success || !json.data?.games?.length) break;

    all.push(...json.data.games);
    totalPages = json.data.pagination.total_pages;
    logger.info({ page, totalPages, loaded: all.length }, "iGamingAPI: catalog page loaded");
    page++;
  }

  logger.info({ total: all.length }, "iGamingAPI: catalog complete");
  return all;
}

// ─── Game launch ──────────────────────────────────────────────────────────────

export interface OpenGameParams {
  user: Pick<User, "id" | "username">;
  gameId: string;   // the numeric game id as string (from catalog)
  currency: string;
  language?: string;
  demo?: boolean;
  exitUrl: string;
}

export interface OpenGameResult {
  url: string;
  sessionId: string;
}

export async function openGame(params: OpenGameParams): Promise<OpenGameResult> {
  const t = token();
  const s = secret();

  const playerId = `${params.user.username.replace(/[^a-zA-Z0-9_]/g, "_")}_${params.user.id}`;

  // Get player's current balance from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: params.user.id },
    select: { balance: true },
  });
  const balance = dbUser ? Number(dbUser.balance) : 0;

  const payload: Record<string, string | number> = {
    token: t,
    secret: s,
    game_uid: params.gameId,
    user_id: playerId,
    balance,
    currency: params.currency,
    return_url: params.exitUrl,
    lang: params.language ?? "en",
  };

  if (env.IGAMINGAPI_CALLBACK_URL) {
    payload.callback_url = env.IGAMINGAPI_CALLBACK_URL;
  }

  const rawBody = JSON.stringify(payload);
  const launchUrl = `${API_BASE}/launch-game`;

  logger.info({ gameId: params.gameId, playerId }, "iGamingAPI: openGame request");

  let res: Response;
  let rawText: string;
  try {
    res = await fetchT(launchUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: rawBody,
    });
    rawText = await res.text();
  } catch (err) {
    logger.error({ gameId: params.gameId, err: (err as Error).message }, "iGamingAPI: openGame network error");
    throw BadRequest("Could not reach the game provider. Please try again.");
  }

  logger.info({ gameId: params.gameId, status: res.status, body: rawText.slice(0, 500) }, "iGamingAPI: openGame response");

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    logger.error({ status: res.status, body: rawText.slice(0, 200) }, "iGamingAPI: non-JSON response");
    throw BadRequest("Game provider returned an unexpected response.");
  }

  if (!res.ok || data.status === "error" || data.success === false) {
    const msg = (data.message ?? data.error ?? `Game could not be opened (${res.status})`) as string;
    logger.error({ gameId: params.gameId, status: res.status, data }, "iGamingAPI: openGame failed");
    throw BadRequest(msg);
  }

  // iGamingAPI returns the game URL in data.url or data.data.url
  const inner = data.data as Record<string, unknown> | undefined;
  const url = (data.url ?? inner?.url ?? data.game_url ?? inner?.game_url) as string | undefined;
  const sessionId = (data.session_id ?? data.sessionId ?? inner?.session_id ?? `igaming_${params.user.id}_${Date.now()}`) as string;

  if (!url) {
    logger.warn({ gameId: params.gameId, data }, "iGamingAPI: missing game url in response");
    throw BadRequest("Game session could not be created.");
  }

  // Persist session for wallet callbacks
  try {
    await prisma.gameSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: params.user.id,
        login: playerId.slice(0, 100),
        currency: params.currency,
        gameId: params.gameId.slice(0, 100),
      },
      update: { userId: params.user.id, login: playerId.slice(0, 100), currency: params.currency },
    });
  } catch (err) {
    logger.error({ sessionId, err: (err as Error).message }, "gameSession upsert failed");
  }

  return { url, sessionId };
}
