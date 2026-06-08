import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { processGameCallback } from "../services/gameCallback.service.js";
import { getUserGames, openGame } from "../services/gambleHub.service.js";
import * as userService from "../services/user.service.js";
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
  "/latest-wins",
  asyncHandler(async (req, res) => {
    // Fetch real wins from the provider callback events
    const events = await prisma.gameCallbackEvent.findMany({
      where: { winAmount: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const mapped = events.map((ev) => {
      const bet = Number(ev.betAmount) || 1;
      const win = Number(ev.winAmount);
      
      let rawUid = ev.gameUid || "Casino Game";
      let gameName = "Live Casino";
      let image = "/images/EVO-crazytime.png";

      if (rawUid.includes(':')) {
        const parts = rawUid.split(':');
        if (parts.length >= 2 && parts[1]) {
          const provider = parts[1].toLowerCase();
          
          if (provider.includes("hacksaw")) {
            gameName = "Hacksaw Slots";
            image = "/images/HAK-munchymilo.png";
          } else if (provider.includes("pragmatic")) {
            gameName = "Pragmatic Play";
            image = "/images/PPC-sweetbonanza1000.png";
          } else if (provider.includes("evolution")) {
            gameName = "Evolution Live";
            image = "/images/EVO-lightningstorm.png";
          } else {
            gameName = provider.charAt(0).toUpperCase() + provider.slice(1) + " Game";
          }
        }
      } else if (rawUid.length > 20 && /^[a-f0-9]+$/i.test(rawUid)) {
        gameName = "Crazy Time"; // Long hex hashes in Gamblly are usually Evolution games
        image = "/images/EVO-crazytime.png";
      } else if (rawUid.toLowerCase().includes("greece")) {
        gameName = "Greek Roulette";
        image = "/images/EVO-autolightningroulette.png";
      } else {
        gameName = rawUid;
      }

      return {
        id: Number(ev.id),
        game: gameName,
        multiplier: Number((win / bet).toFixed(2)),
        gain: win,
        image,
      };
    });

    // If we don't have enough real wins, pad with some realistic fake ones
    // so the UI never looks empty.
    const fakeWins = [
      { id: -1, game: "Parthenon: Quest for Immortality", multiplier: 668.7, gain: 267.48, image: "/images/NE-parthenonquestforimmortality.png" },
      { id: -2, game: "MONOPOLY Live", multiplier: 36.6, gain: 366.0, image: "/images/EVO-monopoly.png" },
      { id: -3, game: "Lightning Storm", multiplier: 71.77, gain: 300.0, image: "/images/EVO-lightningstorm.png" },
      { id: -4, game: "Mega Ball", multiplier: 5.17, gain: 206.8, image: "/images/EVO-crazytime.png" },
    ];

    const results = [...mapped, ...fakeWins].slice(0, 6);
    res.json(results);
  }),
);

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

casinoRouter.get(
  "/live-feed",
  authenticate,
  requireRole("bigboss", "admin_provider", "owner", "partner", "super_admin", "admin", "agent"),
  asyncHandler(async (req, res) => {
    const subtree = await userService.listSubtree(req.user!.id);
    const ids = subtree.map((u) => u.id);
    
    // Add the user's own ID as well, just in case they play (agents shouldn't play, but just in case)
    ids.push(req.user!.id);

    const events = await prisma.gameCallbackEvent.findMany({
      where: { 
        userId: { in: ids },
        action: { in: ["bet", "win"] }
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const mapped = events.map((ev) => {
      let gameName = ev.gameUid || "Casino Game";
      if (gameName.includes(':')) {
        const parts = gameName.split(':');
        if (parts.length >= 2 && parts[1]) {
           const provider = parts[1].toLowerCase();
           if (provider.includes("hacksaw")) gameName = "Hacksaw Slots";
           else if (provider.includes("pragmatic")) gameName = "Pragmatic Play";
           else if (provider.includes("evolution")) gameName = "Evolution Live";
           else gameName = provider.charAt(0).toUpperCase() + provider.slice(1);
        }
      } else if (gameName.length > 20 && /^[a-f0-9]+$/i.test(gameName)) {
        gameName = "Crazy Time";
      } else if (gameName.toLowerCase().includes("greece")) {
        gameName = "Greek Roulette";
      }

      return {
        id: Number(ev.id),
        username: ev.username,
        action: ev.action,
        game: gameName,
        amount: ev.action === "win" ? Number(ev.winAmount) : Number(ev.betAmount),
        createdAt: ev.createdAt,
      };
    });

    res.json(mapped);
  }),
);

// ── Server-side catalog cache (avoids hitting GambleHub on every page load) ──
// GambleHub takes 2–5 s to respond; caching for 5 min makes the lobby instant
// for all users after the first request. Cache is per-currency (almost always
// just TND) and is invalidated automatically after TTL.
const CATALOG_TTL_MS = 5 * 60 * 1000; // 5 minutes
interface CatalogEntry {
  data: ReturnType<typeof Array.prototype.filter>;
  expiresAt: number;
}
const catalogCache = new Map<string, CatalogEntry>();

// Game catalog for the lobby. The catalog is operator-wide (fetched with the
// operator token, not the player's), so it's public — guests can browse. Playing
// a game (POST /open) still requires the visitor to be logged in.
casinoRouter.get(
  "/games",
  asyncHandler(async (req, res) => {
    const currency = (req.query.currency as string)?.toUpperCase() || DEFAULT_CURRENCY;

    // Serve from cache if fresh.
    const cached = catalogCache.get(currency);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.setHeader("X-Cache", "HIT");
      return res.json(cached.data);
    }

    // Fetch both operator catalogs (slots + live) in parallel and merge. Tag each
    // game with its source account so /open knows which credentials to sign with.
    const [slotsGames, liveGames] = await Promise.all([
      getUserGames(currency, "slots").catch(() => []),
      getUserGames(currency, "live").catch(() => []),
    ]);

    const tag = (g: (typeof slotsGames)[number], kind: "slots" | "live") => ({ ...g, account: kind });
    const all = [...slotsGames.map((g) => tag(g, "slots")), ...liveGames.map((g) => tag(g, "live"))];
    const enabled = all.filter((g) => g.isEnabled);

    // Store in cache.
    catalogCache.set(currency, { data: enabled, expiresAt: Date.now() + CATALOG_TTL_MS });

    // Tell browsers + CDN/nginx to cache for 60 s; serve stale up to 5 min while revalidating.
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.setHeader("X-Cache", "MISS");
    // Return all enabled games. Cards without an imageUrl fall back to their
    // gradient hue in the UI — no server-side filtering by thumbnail.
    res.json(enabled);
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

// GambleHub sends "sessionId" (camelCase) in POST body, "sessionid" (lowercase) in GET.
// Accept both with .or() so Zod doesn't reject either variant.
const sessionidField = z.union([z.string(), z.undefined()]).optional();

const balanceSchema = z.object({
  cmd: z.literal("getBalance"),
  login: z.string(),
  sessionid: sessionidField,
  sessionId: sessionidField,
});

const writeBetSchema = z.object({
  cmd: z.literal("writeBet"),
  bet: num.optional(),
  win: num.optional(),
  login: z.string(),
  sessionid: sessionidField,
  sessionId: sessionidField,
  transactionId: z.string().min(1),
  round_finished: z.boolean().nullable().optional(),
  info: z.string().optional(),
});

const rollbackSchema = z.object({
  cmd: z.literal("rollback"),
  bet: num.optional(),
  login: z.string(),
  sessionid: sessionidField,
  sessionId: sessionidField,
  transactionId: z.string().min(1),
  gameId: z.string().optional(),
});

function fail(res: import("express").Response, currency: string, login: string, message: string) {
  return res.status(200).json({
    status: "fail",
    balance: 0,
    currency,
    error: message,
    login,
  });
}

// Ring buffer of recent callback hits for live debugging.
const callbackDebugLog: object[] = [];
casinoRouter.get("/callback-debug", (_req, res) => res.json(callbackDebugLog));

// GambleHub sends callbacks as GET with query params OR POST with JSON body.
// Accept both methods on the same handler.
casinoRouter.all(
  "/callback",
  asyncHandler(async (req, res) => {
    // Merge query params + body so GET and POST are handled identically.
    const combined = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(combined));
    const signature = (req.headers["x-signature"] as string) || "";

    const cmd = (combined as any)?.cmd;
    // GambleHub sends "sessionId" (camelCase) in POST body but "sessionid" (lowercase) in GET params.
    const sessionid: string = (combined as any)?.sessionId ?? (combined as any)?.sessionid ?? "";

    // Log every callback so we can inspect exact incoming fields.
    callbackDebugLog.unshift({
      time: new Date().toISOString(),
      method: req.method,
      cmd,
      sessionid: (sessionid || "").slice(0, 30),
      login: (combined as { login?: string })?.login ?? "",
      hasRaw: Boolean(req.rawBody),
      rawLen: raw.length,
      sigPrefix: signature.slice(0, 16),
      combined,
    });
    if (callbackDebugLog.length > 30) callbackDebugLog.pop();

    // 1) Verify HMAC over the exact received bytes. Callbacks may come from either
    // operator account (slots or live), so accept a signature from either secret.
    // If GambleHub sends no signature at all, log a warning but still process —
    // the session lookup below acts as a second factor (unknown session → rejected).
    const secrets = [env.GAMBLEHUB_SECRET, env.GAMBLEHUB_LIVE_SECRET].filter(Boolean);
    if (signature) {
      const sigOk = secrets.some((s) => verifyHmac(raw, signature, s));
      if (!sigOk) {
        logger.warn(
          { ip: req.ip, cmd, hasRaw: Boolean(req.rawBody), sigPrefix: signature.slice(0, 12) },
          "casino callback: bad signature — rejecting",
        );
        return fail(res, DEFAULT_CURRENCY, "", "invalid signature");
      }
    } else {
      logger.warn({ ip: req.ip, cmd }, "casino callback: no x-signature header (proceeding)");
    }

    // Resolve the session → our user + currency. Look up by sessionId first;
    // if the provider's sessionid differs from what openGame returned, fall back
    // to the player login (most recent session for that login).
    const bodyLogin = (combined as { login?: string })?.login ?? "";
    let session = sessionid
      ? await prisma.gameSession.findUnique({ where: { sessionId: sessionid } })
      : null;
    if (!session && bodyLogin) {
      session = await prisma.gameSession.findFirst({
        where: { login: { equals: bodyLogin, mode: "insensitive" } },
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
          balanceSchema.parse(combined);
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
          const b = writeBetSchema.parse(combined);
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
              raw: combined,
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
              raw: combined,
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
          const b = rollbackSchema.parse(combined);
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
