import crypto from "node:crypto";
import { Prisma, type TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { BadRequest, Forbidden, NotFound } from "../lib/errors.js";
import { canManage } from "../domain/hierarchy.js";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export interface TransferInput {
  actorId: number;
  targetUserId: number;
  amount: number | string;
  type: TransactionType; // deposit = credit child, withdrawal = pull from child
  description?: string;
}

/**
 * Move credit between a parent (actor) and a direct child.
 *  - deposit:    actor.balance -> child.balance   (actor gives credit down)
 *  - withdrawal: child.balance -> actor.balance   (actor pulls credit back up)
 *
 * Runs in a single serializable DB transaction so balances can never drift
 * and the ledger row always matches the balance change.
 */
export async function transfer(input: TransferInput) {
  const amount = D(input.amount);
  if (amount.lte(0)) throw BadRequest("Amount must be positive");

  return prisma.$transaction(
    async (tx) => {
      const [actor, target] = await Promise.all([
        tx.user.findUnique({ where: { id: input.actorId } }),
        tx.user.findUnique({ where: { id: input.targetUserId } }),
      ]);
      if (!actor) throw NotFound("Actor not found");
      if (!target) throw NotFound("Target user not found");
      if (target.parentId !== actor.id && actor.role !== "admin_provider") {
        throw Forbidden("You can only transact with your direct downline");
      }
      if (actor.role && target.role && !canManage(actor.role, target.role)) {
        throw Forbidden("Target is not below you in the hierarchy");
      }

      // Decide direction.
      const giver = input.type === "deposit" ? actor : target;
      const receiver = input.type === "deposit" ? target : actor;

      // Admin is an infinite source/sink (matches xbet): no balance check and
      // the admin's own balance is never debited/credited by transfers.
      const giverIsAdmin = giver.role === "admin_provider";

      if (!giverIsAdmin && D(giver.balance).lt(amount)) {
        throw BadRequest("Insufficient balance");
      }

      if (!giverIsAdmin) {
        await tx.user.update({
          where: { id: giver.id },
          data: { balance: { decrement: amount } },
        });
      }
      if (receiver.role !== "admin_provider") {
        await tx.user.update({
          where: { id: receiver.id },
          data: { balance: { increment: amount } },
        });
      }

      const txn = await tx.transaction.create({
        data: {
          senderId: giver.id,
          receiverId: receiver.id,
          amount,
          type: input.type,
          description: input.description,
          txnRef: `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role ?? "unknown",
          action: `wallet.${input.type}`,
          entityType: "user",
          entityId: String(target.id),
          newJson: { amount: amount.toString(), txnRef: txn.txnRef },
        },
      });

      return txn;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Adjust a user's locked exposure (called by bet/game flows). */
export async function adjustExposure(
  tx: Prisma.TransactionClient,
  userId: number,
  delta: Prisma.Decimal.Value,
) {
  await tx.user.update({
    where: { id: userId },
    data: { exposure: { increment: D(delta) } },
  });
}

export async function getBalance(userId: number) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, exposure: true, creditRef: true },
  });
  if (!u) throw NotFound("User not found");
  return {
    balance: u.balance.toString(),
    exposure: u.exposure.toString(),
    available: D(u.balance).sub(u.exposure).toString(),
    creditRef: u.creditRef.toString(),
  };
}
