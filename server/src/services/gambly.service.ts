import type { User } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { AppError, BadRequest } from "../lib/errors.js";

// ─── Gamblly V1 Seamless Wallet ───────────────────────────────────────────────
// Balance stays in OUR DB (users.balance). On launch we POST /v1/gameLaunch.php
// (form-encoded) and get back a game_url + transfer_id. During play Gamblly
// calls our callback for every bet/win; we apply it and return the new balance.
// Callback URL is configured in the Gamblly panel (no per-launch callback field).

const BASE = (env.GAMBLY_API_BASE_URL || "https://game.gambllyapi.com/production/").replace(/\/$/, "");
const KEY = env.GAMBLY_API_KEY;
const CURRENCY = (env.GAMBLY_CURRENCY || "TND").toUpperCase();

function assertConfigured() {
  if (!KEY) throw new AppError(503, "Gamblly is not configured", "GAMBLY_DISABLED");
}

// fetch with a hard timeout so a hanging provider returns a clean error.
async function fetchT(url: string, init: RequestInit, timeoutMs = 12_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface LaunchResponse {
  success?: boolean;
  game_url?: string;
  transfer_id?: string;
  msg?: string;
  code?: number;
}

export interface GamblyLaunchParams {
  user: Pick<User, "id" | "username">;
  gameUid: string;
  language?: string;
  homeUrl: string;
}

export interface GamblyLaunchResult {
  url: string;
  transferId: string;
}

/**
 * Launch a Gamblly game (V1 seamless). member_account = our username so the
 * callback can resolve the player. Persists a GameSession (keyed by transfer_id)
 * mapping the provider session back to our user + currency.
 */
export async function launchGamblyGame(params: GamblyLaunchParams): Promise<GamblyLaunchResult> {
  assertConfigured();

  const memberAccount = params.user.username;
  const form = new URLSearchParams({
    api_key: KEY,
    member_account: memberAccount,
    game_uid: params.gameUid,
    currency_code: CURRENCY,
    language: params.language ?? "en",
    platform: "1", // 1 = web
    home_url: params.homeUrl,
    ...(env.GAMBLY_CALLBACK_URL ? { callback_url: env.GAMBLY_CALLBACK_URL } : {}),
  });

  let res: Response;
  let rawText: string;
  try {
    res = await fetchT(`${BASE}/v1/gameLaunch.php`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: form,
    });
    rawText = await res.text();
  } catch (err) {
    logger.error({ gameUid: params.gameUid, err: (err as Error).message }, "gambly launch network error");
    throw BadRequest("Could not reach the game provider. Please try again.");
  }

  let data: LaunchResponse = {};
  try {
    data = JSON.parse(rawText) as LaunchResponse;
  } catch {
    logger.error({ gameUid: params.gameUid, status: res.status, body: rawText.slice(0, 200) }, "gambly launch non-JSON");
    throw BadRequest("Game provider returned an unexpected response.");
  }

  if (!res.ok || data.success === false || !data.game_url) {
    const msg = data.msg || `Game could not be opened (${res.status})`;
    logger.warn({ gameUid: params.gameUid, status: res.status, code: data.code, msg }, "gambly launch failed");
    throw BadRequest(msg);
  }

  const transferId = data.transfer_id || `${memberAccount}:${params.gameUid}:${Date.now()}`;

  // Map the session → our user. Keyed by transfer_id (sessionId). The callback
  // identifies the player by member_account (player_uid), so login fallback works.
  try {
    await prisma.gameSession.upsert({
      where: { sessionId: transferId },
      create: {
        sessionId: transferId,
        userId: params.user.id,
        login: memberAccount.slice(0, 100),
        currency: CURRENCY,
        gameId: params.gameUid.slice(0, 100),
      },
      update: { userId: params.user.id, login: memberAccount.slice(0, 100), currency: CURRENCY },
    });
  } catch (err) {
    logger.error({ transferId, err: (err as Error).message }, "gambly gameSession upsert failed");
  }

  return { url: data.game_url, transferId };
}
