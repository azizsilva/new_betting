import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { processGameCallback } from "../services/gameCallback.service.js";
import { launchGamblyGame } from "../services/gambly.service.js";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { NotFound } from "../lib/errors.js";

export const gamblyRouter = Router();

const CURRENCY = (env.GAMBLY_CURRENCY || "TND").toUpperCase();

// ─── Live-casino catalog (Gamblly has no list API; imported via gambly-import) ──
// Served from src/data/gambly-games.json. We only expose LIVE games (Evolution /
// Ezugi / Pragmatic Live) for the Live Casino tab.
interface GamblyGameFile {
  id: string;
  title: string;
  provider: string;
  imageUrl: string;
  isEnabled: boolean;
  account: "gambly";
  live: boolean;
}

let liveGamesCache: GamblyGameFile[] | null = null;
function loadLiveGames(): GamblyGameFile[] {
  if (liveGamesCache) return liveGamesCache;
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // dist/routes → ../../src/data ; src/routes → ../data. Try both.
    const candidates = [
      resolve(__dirname, "../data/gambly-games.json"),
      resolve(__dirname, "../../src/data/gambly-games.json"),
    ];
    for (const p of candidates) {
      try {
        const all = JSON.parse(readFileSync(p, "utf8")) as GamblyGameFile[];
        liveGamesCache = all.filter((g) => g.live && g.isEnabled && g.imageUrl);
        return liveGamesCache;
      } catch {
        /* try next */
      }
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "gambly games file not loaded");
  }
  liveGamesCache = [];
  return liveGamesCache;
}

// Public — guests can browse. Returns only the live games for the lobby.
gamblyRouter.get(
  "/games",
  asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(loadLiveGames());
  }),
);

// ─── Launch (auth) ─────────────────────────────────────────────────────────────
// Opening a game is always allowed (even at 0 balance). Betting is enforced in
// the callback (insufficient balance → rejected), matching the casino rule.

const launchSchema = z.object({
  gameUid: z.string().min(1),
  language: z.string().min(2).max(5).optional(),
});

gamblyRouter.post(
  "/launch",
  authenticate,
  requireRole("player"), // only players can enter/play games
  asyncHandler(async (req, res) => {
    const body = launchSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, language: true },
    });
    if (!user) throw NotFound("User not found");

    logger.info({ gameUid: body.gameUid, userId: user.id }, "gambly launch requested");

    const result = await launchGamblyGame({
      user,
      gameUid: body.gameUid,
      language: body.language ?? user.language ?? "en",
      homeUrl: env.CLIENT_ORIGIN.split(",")[0]!.trim(),
    });

    // Best-effort recent-game tracking (never break the launch on a race).
    try {
      const gameId = body.gameUid.slice(0, 50);
      await prisma.recentGame.upsert({
        where: { userId_gameId: { userId: user.id, gameId } },
        create: { userId: user.id, gameId },
        update: {},
      });
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "gambly recentGame upsert skipped");
    }

    res.json({ url: result.url, sessionId: result.transferId });
  }),
);

// ─── Seamless wallet callback (server-to-server, Gamblly → us) ──────────────────
// Authenticated by api_key in the body + IP/domain whitelist on Gamblly's side.
// We must apply the balance change and return the latest balance.

const num = z.union([z.number(), z.string()]).transform((v) => Number(v) || 0);
const str = z.union([z.string(), z.number()]).transform(String);

const callbackSchema = z.object({
  player_uid: str.refine(s => s.length > 0, "Missing player_uid"),
  bet_amount: num.optional(),
  win_amount: num.optional(),
  action: str.default("bet_win"),
  game_uid: str.optional(),
  game_name: str.optional(),
  txn_id: str.optional(),
  game_round: str.optional(),
  currency_code: str.optional(),
  api_key: str.optional(),
  msg: str.optional(),
});

gamblyRouter.post(
  "/callback",
  asyncHandler(async (req, res) => {
    // 1) Authenticate the caller by the shared agency API key in the body.
    const bodyKey = (req.body as { api_key?: string })?.api_key ?? "";
    if (!env.GAMBLY_API_KEY || bodyKey !== env.GAMBLY_API_KEY) {
      logger.warn({ ip: req.ip, hasKey: Boolean(bodyKey) }, "gambly callback: bad api_key");
      return res.status(401).json({ balance: 0, status: false, msg: "unauthorized" });
    }

    const parsed = callbackSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues.slice(0, 3) }, "gambly callback: invalid body");
      return res.status(400).json({ balance: 0, status: false, msg: "invalid request" });
    }
    const b = parsed.data;

    // 2) deposit_required is an informational system notice — ack, no balance change.
    if (b.action === "deposit_required") {
      const session = await resolveSession(b.player_uid);
      const bal = session ? await currentBalance(session.userId) : 0;
      return res.json(ok(bal));
    }

    // 3) Resolve the player from member_account (player_uid).
    const session = await resolveSession(b.player_uid);
    if (!session) {
      logger.warn({ player: b.player_uid, action: b.action }, "gambly callback: unknown player");
      return res.status(400).json({ balance: 0, status: false, msg: "unknown player" });
    }

    const bet = b.bet_amount ?? 0;
    const win = b.win_amount ?? 0;

    try {
      let balance: string | null = null;

      // bet>0 → debit (idempotent on txn_id+"bet").
      if (bet > 0) {
        if (!b.txn_id) throw new Error("Missing txn_id for bet");
        const r = await processGameCallback({
          userId: session.userId,
          action: "bet",
          txnId: b.txn_id,
          gameUid: b.game_uid ?? session.gameId,
          gameRound: b.game_round ?? b.txn_id,
          betAmount: bet,
          raw: req.body,
          requestIp: req.ip,
          requestUa: req.headers["user-agent"],
        });
        balance = r.balance;
      }

      // win>0 → credit (idempotent on txn_id+"win"; distinct action key).
      if (win > 0) {
        if (!b.txn_id) throw new Error("Missing txn_id for win");
        const r = await processGameCallback({
          userId: session.userId,
          action: "win",
          txnId: b.txn_id,
          gameUid: b.game_uid ?? session.gameId,
          gameRound: b.game_round ?? b.txn_id,
          winAmount: win,
          raw: req.body,
          requestIp: req.ip,
          requestUa: req.headers["user-agent"],
        });
        balance = r.balance;
      }

      // refund/rollback → restore the stake.
      if (b.action === "refund" && bet === 0) {
        if (!b.txn_id) throw new Error("Missing txn_id for refund");
        const r = await processGameCallback({
          userId: session.userId,
          action: "refund",
          txnId: b.txn_id,
          gameUid: b.game_uid ?? session.gameId,
          gameRound: b.game_round ?? b.txn_id,
          betAmount: win || bet,
          raw: req.body,
          requestIp: req.ip,
          requestUa: req.headers["user-agent"],
        });
        balance = r.balance;
      }

      if (balance === null) balance = String(await currentBalance(session.userId));

      return res.json(ok(Number(balance)));
    } catch (err) {
      // Insufficient balance / validation → HTTP 400 with the current balance.
      const message = err instanceof Error ? err.message : "callback error";
      logger.warn({ player: b.player_uid, action: b.action, message }, "gambly callback failed");
      const bal = await currentBalance(session.userId);
      return res.status(400).json({ balance: bal, status: false, msg: message });
    }
  }),
);

// Success shape. Doc: must return numeric `balance`; for compatibility we also
// echo it under data.balance and include status:true.
function ok(balance: number) {
  return { balance, status: true, data: { balance } };
}

// Resolve the most recent session for a member_account (player_uid).
async function resolveSession(playerUid: string) {
  return prisma.gameSession.findFirst({
    where: { login: playerUid },
    orderBy: { createdAt: "desc" },
  });
}

async function currentBalance(userId: number): Promise<number> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
  return u ? Number(u.balance) : 0;
}
