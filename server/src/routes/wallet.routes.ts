import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import * as wallet from "../services/wallet.service.js";

export const walletRouter = Router();
walletRouter.use(authenticate);

walletRouter.get(
  "/balance",
  asyncHandler(async (req, res) => {
    res.json(await wallet.getBalance(req.user!.id));
  }),
);

// Transfer history for the actor — both credits sent and received.
walletRouter.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const id = req.user!.id;
    const take = Math.min(Number(req.query.limit ?? 50), 200);
    const rows = await prisma.transaction.findMany({
      where: { OR: [{ senderId: id }, { receiverId: id }] },
      orderBy: { createdAt: "desc" },
      take,
    });
    // Enrich with counterparty usernames + direction relative to the actor.
    const ids = [...new Set(rows.flatMap((r) => [r.senderId, r.receiverId]))];
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.username]));
    res.json(
      rows.map((r) => ({
        id: r.id,
        amount: r.amount.toString(),
        type: r.type,
        description: r.description,
        txnRef: r.txnRef,
        createdAt: r.createdAt,
        direction: r.receiverId === id ? "in" : "out",
        counterparty:
          r.receiverId === id ? nameById.get(r.senderId) : nameById.get(r.receiverId),
      })),
    );
  }),
);

const transferSchema = z.object({
  targetUserId: z.number().int().positive(),
  amount: z.union([z.number().positive(), z.string()]),
  type: z.enum(["deposit", "withdrawal"]),
  description: z.string().max(255).optional(),
});

// Credit down / pull up between actor and a direct child.
walletRouter.post(
  "/transfer",
  asyncHandler(async (req, res) => {
    const body = transferSchema.parse(req.body);
    const txn = await wallet.transfer({ actorId: req.user!.id, ...body });
    res.status(201).json(txn);
  }),
);
