import type { User } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { AppError, BadRequest } from "../lib/errors.js";

const BASE = "https://game.gambllyapi.com/production";
const KEY = env.GAMBLY_API_KEY;
const CURRENCY = "TND";

export interface GamblyLaunchParams {
  user: { id: number; username: string };
  gameUid: string;
  language?: string;
  homeUrl: string;
}

export interface GamblyLaunchResult {
  gameUrl: string;
}

function assertConfigured() {
  if (!KEY) throw new AppError(503, "Gamblly is not configured", "GAMBLY_DISABLED");
}

async function fetchT(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    logger.error({ status: res.status, txt }, "Gamblly HTTP error");
    throw BadRequest(`Provider HTTP ${res.status}`);
  }
  return res;
}

/**
 * Launch a Gamblly game (V1 Seamless).
 * We pass credit_amount to bypass the GGR limitation and show instant balance.
 */
export async function launchGamblyGame(params: GamblyLaunchParams): Promise<GamblyLaunchResult> {
  assertConfigured();

  const user = await prisma.user.findUnique({ where: { id: params.user.id } });
  if (!user) throw BadRequest("User not found");

  const memberAccount = params.user.username;
  const currentBalance = Number(user.balance);

  const form = new URLSearchParams({
    api_key: KEY,
    member_account: memberAccount,
    game_uid: params.gameUid,
    credit_amount: String(currentBalance),
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

  let data: any = {};
  try {
    data = JSON.parse(rawText);
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

  // Map the session → our user. Keyed by transfer_id (sessionId).
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

  return { gameUrl: data.game_url };
}
