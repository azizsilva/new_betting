import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate } from "../middleware/auth.js";
import { processGameCallback } from "../services/gameCallback.service.js";
import { prisma } from "../lib/prisma.js";

export const casinoRouter = Router();

// ─── Player-facing ───
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

// ─── Provider callback (server-to-server) ───
// In production this endpoint must verify the provider signature/IP allowlist.
const callbackSchema = z.object({
  userId: z.number().int().positive(),
  action: z.enum(["bet", "win", "refund"]),
  txnId: z.string().min(1),
  gameUid: z.string().optional(),
  gameRound: z.string().optional(),
  betAmount: z.union([z.number(), z.string()]).optional(),
  winAmount: z.union([z.number(), z.string()]).optional(),
});

casinoRouter.post(
  "/callback",
  asyncHandler(async (req, res) => {
    const body = callbackSchema.parse(req.body);
    const result = await processGameCallback({
      ...body,
      requestIp: req.ip,
      requestUa: req.headers["user-agent"],
      raw: req.body,
    });
    res.json(result);
  }),
);
