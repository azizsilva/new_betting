import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { processGameCallback } from "../services/gameCallback.service.js";
import { getUserGames, openGame } from "../services/gambleHub.service.js";
import { verifyHmac } from "../lib/hmac.js";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { NotFound } from "../lib/errors.js";

export const casinoRouter = Router();

// Default session currency. Games are registered under TND in this operator's account.
// Override with GAMBLEHUB_CURRENCY env var if needed.
const DEFAULT_CURRENCY = (env.GAMBLEHUB_CURRENCY || "TND").toUpperCase();

// ─── Player-facing ────────────────────────────────────────────────────────────

casinoRouter.get(
  "/recent",
  authenticate,
  asyncHandler(async (req, res) => {
    const rows = await prisma.recentGame.findMany({
      where: { userId: req.user!.id },
      orderBy: { playedAt: "desc" },
      take: 20,
    });
    res.json(rows);
  }),
);

// Game catalog for the lobby. The catalog is operator-wide (fetched with the
// operator token, not the player's), so it's public — guests can browse. Playing
// a game (POST /open) still requires the visitor to be logged in.
casinoRouter.get(
  "/games",
  asyncHandler(async (req, res) => {
    const currency = (req.query.currency as string)?.toUpperCase() || DEFAULT_CURRENCY;

    // Fetch both operator catalogs (slots + live) in parallel and merge. Tag each
    // game with its source account so /open knows which credentials to sign with.
    const [slotsGames, liveGames] = await Promise.all([
      getUserGames(currency, "slots").catch(() => []),
      getUserGames(currency, "live").catch(() => []),
    ]);

    const tag = (g: (typeof slotsGames)[number], kind: "slots" | "live") => ({ ...g, account: kind });
    const all = [...slotsGames.map((g) => tag(g, "slots")), ...liveGames.map((g) => tag(g, "live"))];

    res.setHeader("Cache-Control", "no-store");
    // Only enabled games with a real thumbnail (skip the imageless IGT/Amatic ones).
    res.json(all.filter((g) => g.isEnabled && g.imageUrl));
  }),
);

// Open a game session → returns iframe url + sessionId.
const openSchema = z.object({
  gameId: z.string().min(1),
  demo: z.boolean().optional(),
  language: z.string().min(2).max(5).optional(),
  exitUrl: z.string().url().optional(),
  account: z.enum(["slots", "live"]).optional(),
});

casinoRouter.post(
  "/open",
  authenticate,
  requireRole("player"), // only players can enter/play games
  asyncHandler(async (req, res) => {
    const body = openSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, language: true },
    });
    if (!user) throw NotFound("User not found");

    logger.info({ gameId: body.gameId, userId: user.id }, "casino open requested");

    // Opening a game is always allowed — even at 0 balance. Betting is enforced
    // later in the seamless wallet callback, not here.
    const result = await openGame({
      user,
      gameId: body.gameId,
      currency: DEFAULT_CURRENCY,
      language: body.language ?? user.language,
      demo: body.demo,
      exitUrl: body.exitUrl ?? env.CLIENT_ORIGIN.split(",")[0]!.trim(),
      kind: body.account ?? "slots",
    });

    // Track recently played (best-effort). Never let a logging write — or a
    // concurrent-upsert race (P2002) — break the game launch.
    try {
      const gameId = body.gameId.slice(0, 50);
      await prisma.recentGame.upsert({
        where: { userId_gameId: { userId: user.id, gameId } },
        create: { userId: user.id, gameId },
        update: {}, // playedAt is @updatedAt — Prisma refreshes it automatically
      });
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "recentGame upsert skipped");
    }

    res.json(result);
  }),
);

// ─── Seamless wallet callback (server-to-server, provider → us) ────────────────
// No auth header; integrity is enforced by HMAC over the raw body (doc §6, §7).

interface CallbackOk {
  balance: number;
  currency: string;
  error: string;
  login: string;
  status: "success";
}

const num = z.union([z.number(), z.string()]).transform((v) => Number(v) || 0);

const balanceSchema = z.object({
  cmd: z.literal("getBalance"),
  login: z.string(),
  sessionid: z.string(),
});

const writeBetSchema = z.object({
  cmd: z.literal("writeBet"),
  bet: num.optional(),
  win: num.optional(),
  login: z.string(),
  sessionid: z.string(),
  transactionId: z.string().min(1),
  round_finished: z.boolean().nullable().optional(),
  info: z.string().optional(),
});

const rollbackSchema = z.object({
  cmd: z.literal("rollback"),
  bet: num.optional(),
  login: z.string(),
  sessionid: z.string(),
  transactionId: z.string().min(1),
  gameId: z.string().optional(),
});

function fail(res: import("express").Response, currency: string, login: string, message: string) {
  return res.status(400).json({
    status: "fail",
    balance: 0,
    currency,
    error: message,
    login,
  });
}

casinoRouter.post(
  "/callback",
  asyncHandler(async (req, res) => {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const signature = (req.headers["x-signature"] as string) || "";

    const cmd = (req.body as { cmd?: string })?.cmd;
    const sessionid = (req.body as { sessionid?: string })?.sessionid ?? "";

    // 1) Verify HMAC over the exact received bytes. Callbacks may come from either
    // operator account (slots or live), so accept a signature from either secret.
    const secrets = [env.GAMBLEHUB_SECRET, env.GAMBLEHUB_LIVE_SECRET].filter(Boolean);
    const sigOk = secrets.some((s) => verifyHmac(raw, signature, s));
    if (!sigOk) {
      logger.warn(
        { ip: req.ip, cmd, hasRaw: Boolean(req.rawBody), sigPrefix: signature.slice(0, 12) },
        "casino callback: bad signature",
      );
      return fail(res, DEFAULT_CURRENCY, "", "invalid signature");
    }

    // Resolve the session → our user + currency. Look up by sessionId first;
    // if the provider's sessionid differs from what openGame returned, fall back
    // to the player login (most recent session for that login).
    const bodyLogin = (req.body as { login?: string })?.login ?? "";
    let session = sessionid
      ? await prisma.gameSession.findUnique({ where: { sessionId: sessionid } })
      : null;
    if (!session && bodyLogin) {
      session = await prisma.gameSession.findFirst({
        where: { login: bodyLogin },
        orderBy: { createdAt: "desc" },
      });
    }
    const currency = session?.currency ?? DEFAULT_CURRENCY;
    const login = bodyLogin || session?.login || "";

    if (!session) {
      logger.warn({ cmd, sessionidPrefix: sessionid.slice(0, 20), login }, "casino callback: unknown session");
      return fail(res, currency, login, "unknown session");
    }
    logger.info({ cmd, login, userId: session.userId }, "casino callback ok");

    try {
      switch (cmd) {
        case "getBalance": {
          balanceSchema.parse(req.body);
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { balance: true },
          });
          if (!user) return fail(res, currency, login, "user not found");
          const ok: CallbackOk = {
            balance: Number(user.balance),
            currency,
            error: "",
            login,
            status: "success",
          };
          return res.json(ok);
        }

        case "writeBet": {
          const b = writeBetSchema.parse(req.body);
          const bet = b.bet ?? 0;
          const win = b.win ?? 0;
          const gameRound = b.transactionId; // per-round key for exposure tracking

          let balance: string | null = null;

          // bet>0 → debit. Idempotent on (transactionId, "bet").
          if (bet > 0) {
            const r = await processGameCallback({
              userId: session.userId,
              action: "bet",
              txnId: b.transactionId,
              gameUid: session.gameId,
              gameRound,
              betAmount: bet,
              raw: req.body,
              requestIp: req.ip,
              requestUa: req.headers["user-agent"],
            });
            balance = r.balance;
          }

          // win>0 → credit. Idempotent on (transactionId, "win"); distinct action
          // lets a single round carry both bet and win without key collision.
          if (win > 0) {
            const r = await processGameCallback({
              userId: session.userId,
              action: "win",
              txnId: b.transactionId,
              gameUid: session.gameId,
              gameRound,
              winAmount: win,
              raw: req.body,
              requestIp: req.ip,
              requestUa: req.headers["user-agent"],
            });
            balance = r.balance;
          }

          // bet=0 & win=0 → bonus / free spin: no balance change, just ack.
          if (balance === null) {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              select: { balance: true },
            });
            balance = user ? user.balance.toString() : "0";
          }

          const ok: CallbackOk = {
            balance: Number(balance),
            currency,
            error: "",
            login,
            status: "success",
          };
          return res.json(ok);
        }

        case "rollback": {
          const b = rollbackSchema.parse(req.body);
          // Refund the staked amount; keyed on the SAME transactionId as the bet,
          // but action "refund" so it's independently idempotent.
          const r = await processGameCallback({
            userId: session.userId,
            action: "refund",
            txnId: b.transactionId,
            gameUid: b.gameId ?? session.gameId,
            gameRound: b.transactionId,
            betAmount: b.bet ?? 0,
            raw: req.body,
            requestIp: req.ip,
            requestUa: req.headers["user-agent"],
          });
          const ok: CallbackOk = {
            balance: Number(r.balance),
            currency,
            error: "",
            login,
            status: "success",
          };
          return res.json(ok);
        }

        default:
          return fail(res, currency, login, `unknown cmd: ${cmd}`);
      }
    } catch (err) {
      // Insufficient balance / not found / validation → status fail + HTTP 400 (doc §6.3).
      const message = err instanceof Error ? err.message : "callback error";
      logger.warn({ cmd, login, message }, "casino callback failed");
      return fail(res, currency, login, message);
    }
  }),
);
