import { Prisma, type GameAction } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { BadRequest, NotFound } from "../lib/errors.js";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export interface GameCallbackInput {
  userId: number;
  action: GameAction; // bet | win | refund
  txnId: string; // provider transaction id (idempotency key)
  gameUid?: string;
  gameRound?: string;
  betAmount?: number | string;
  winAmount?: number | string;
  providerTs?: Date;
  requestIp?: string;
  requestUa?: string;
  raw?: unknown;
}

export interface GameCallbackResult {
  status: 1 | 0;
  message: string;
  balance: string;
  duplicate?: boolean;
}

/**
 * Process a casino provider callback. Atomic + idempotent:
 *  - (txnId, action) is unique, so replays return the prior result.
 *  - "bet" debits balance; "win"/"refund" credit it.
 *  - Every call writes a game_callback_event with running balance.
 */
export async function processGameCallback(
  input: GameCallbackInput,
): Promise<GameCallbackResult> {
  // Fast path: replay detection before opening a write txn.
  const existing = await prisma.gameCallbackEvent.findUnique({
    where: { txnId_action: { txnId: input.txnId, action: input.action } },
  });
  if (existing) {
    return {
      status: existing.resultStatus ? 1 : 0,
      message: "Duplicate callback ignored",
      balance: existing.balanceAfter.toString(),
      duplicate: true,
    };
  } // end method

  const bet = D(input.betAmount ?? 0);
  const win = D(input.winAmount ?? 0);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id: input.userId } });
        if (!user) throw NotFound("User not found");

        const balanceBefore = D(user.balance);
        let delta: Prisma.Decimal;

        switch (input.action) {
          case "bet":
            delta = bet.negated();
            if (balanceBefore.add(delta).lt(0)) throw BadRequest("Insufficient balance");
            break;
          case "win":
            delta = win;
            break;
          case "refund":
            delta = bet; // return the staked amount
            break;
          default:
            throw BadRequest("Unknown action");
        }

        const balanceAfter = balanceBefore.add(delta);

        await tx.user.update({
          where: { id: user.id },
          data: { balance: balanceAfter },
        });

        // Track per-round exposure for risk reporting.
        if (input.gameRound) {
          await tx.gameRoundExposure.upsert({
            where: { userId_gameRound: { userId: user.id, gameRound: input.gameRound } },
            create: { userId: user.id, gameRound: input.gameRound, amount: bet },
            update: { amount: { increment: input.action === "bet" ? bet : D(0) } },
          });
        }

        const event = await tx.gameCallbackEvent.create({
          data: {
            userId: user.id,
            username: user.username,
            action: input.action,
            gameUid: input.gameUid,
            txnId: input.txnId,
            gameRound: input.gameRound,
            providerTs: input.providerTs,
            betAmount: bet,
            winAmount: win,
            amountDelta: delta,
            balanceBefore,
            balanceAfter,
            resultStatus: true,
            requestIp: input.requestIp,
            requestUa: input.requestUa,
            rawJson: (input.raw as object) ?? undefined,
          },
        });

        return {
          status: 1 as const,
          message: "ok",
          balance: event.balanceAfter.toString(),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err: any) {
    // P2002 = Unique constraint failed. This happens in a race condition where
    // two identical requests arrive at the exact same millisecond. One succeeds,
    // the other hits this catch block. We should fetch and return the balance
    // from the one that succeeded to maintain idempotency cleanly.
    if (err.code === "P2002") {
      const existing = await prisma.gameCallbackEvent.findUnique({
        where: { txnId_action: { txnId: input.txnId, action: input.action } },
      });
      if (existing) {
        return {
          status: existing.resultStatus ? 1 : 0,
          message: "Duplicate callback ignored (handled via catch)",
          balance: existing.balanceAfter.toString(),
          duplicate: true,
        };
      }
    }
    throw err;
  }
}
