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
 * Launch a Gamblly game (V2 Transfer Wallet).
 * Deducts the user's full balance and transfers it to the game.
 */
export async function launchGamblyGame(params: GamblyLaunchParams): Promise<GamblyLaunchResult> {
  assertConfigured();

  const user = await prisma.user.findUnique({ where: { id: params.user.id } });
  if (!user) throw BadRequest("User not found");

  const memberAccount = params.user.username;
  const transferId = `txn_${Date.now()}_${user.id}`;
  const creditAmount = Number(user.balance);

  // V2 Launch Payload (JSON)
  const payload = {
    agency_uid: KEY,
    member_account: memberAccount,
    game_uid: params.gameUid,
    credit_amount: creditAmount,
    currency_code: CURRENCY,
    language: params.language ?? "en",
    platform: "web",
    home_url: params.homeUrl,
    transfer_id: transferId,
    timestamp: Date.now()
  };

  let rawText: string;
  try {
    const res = await fetchT(`${BASE}/v2/gameLaunch.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    rawText = await res.text();
  } catch (err) {
    logger.error({ gameUid: params.gameUid, err: (err as Error).message }, "gambly launch network error");
    throw BadRequest("Could not reach the game provider. Please try again.");
  }

  let data: any = {};
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    logger.error({ rawText }, "gambly v2 invalid json");
    throw BadRequest("Provider returned invalid data");
  }

  if (data.code !== 0) {
    logger.error({ data }, "gambly v2 launch rejected");
    throw BadRequest(data.msg || "Provider rejected game launch");
  }

  const gameUrl = data.payload?.game_launch_url;
  if (!gameUrl) {
    throw BadRequest("Provider returned no game URL");
  }

  // Deduct balance & Save session
  await prisma.$transaction(async (tx) => {
    // Zero out the user's balance
    await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: creditAmount } },
    });
    // Create session to track the transfer
    await tx.gameSession.create({
      data: {
        userId: user.id,
        login: memberAccount,
        currency: CURRENCY,
        sessionId: transferId,
        gameId: params.gameUid,
      },
    });
  });

  return { gameUrl };
}

/**
 * Withdraw balance from Gamblly V2 session and add it back to the user.
 */
export async function withdrawGamblyBalance(userId: number): Promise<number> {
  assertConfigured();

  // Find the most recent active session
  const session = await prisma.gameSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!session || !session.sessionId) {
    return 0; // No active session
  }

  const payload = {
    agency_uid: KEY,
    member_account: session.login,
    transfer_id: session.sessionId,
    home_url: "https://afrobet216.com", // Recommended by V2 docs
    timestamp: Date.now()
  };

  try {
    const res = await fetchT(`${BASE}/v2/getWithdraw.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const data = JSON.parse(text);

    if (data.status === true || data.code === 0) {
      const amount = Number(data.amount || data.payload?.balance || 0);

      await prisma.$transaction(async (tx) => {
        // Add back to user
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } },
        });
        // Delete session
        await tx.gameSession.delete({
          where: { id: session.id },
        });
      });

      return amount;
    }
  } catch (err) {
    logger.error({ err }, "Failed to withdraw gambly balance");
  }

  return 0;
}
