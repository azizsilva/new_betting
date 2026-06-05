import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Weekly 5% cashback on NET losses (bets − wins) from casino + live games.
// Week = Monday 00:00 UTC → next Monday 00:00 UTC. Payout is AUTOMATIC and
// credited straight to users.balance; idempotent per (userId, weekStart).

const RATE = 5; // percent
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// Monday 00:00 UTC of the week containing `d`.
export function weekStartOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

// Net loss (bets − wins) over [start, end). Only the loss counts (>= 0).
async function netLoss(userId: number, start: Date, end: Date): Promise<Prisma.Decimal> {
  const agg = await prisma.gameCallbackEvent.aggregate({
    where: { userId, createdAt: { gte: start, lt: end } },
    _sum: { betAmount: true, winAmount: true },
  });
  const bets = D(agg._sum.betAmount ?? 0);
  const wins = D(agg._sum.winAmount ?? 0);
  const loss = bets.sub(wins);
  return loss.gt(0) ? loss : D(0);
}

/**
 * Settle every completed week that hasn't been paid yet for this user, crediting
 * 5% of the net loss to their balance. Safe to call on every dashboard load:
 * idempotent via the (userId, weekStart) unique constraint.
 */
export async function settleDueCashback(userId: number, now = new Date()): Promise<void> {
  const currentWeek = weekStartOf(now);

  // Earliest activity → don't scan further back than the user's first bet.
  const first = await prisma.gameCallbackEvent.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (!first) return;

  // Most recent already-paid week, to avoid rescanning everything.
  const lastPaid = await prisma.cashbackPayout.findFirst({
    where: { userId },
    orderBy: { weekStart: "desc" },
    select: { weekStart: true },
  });

  let week = lastPaid ? addDays(lastPaid.weekStart, 7) : weekStartOf(first.createdAt);

  // Pay each COMPLETED week (strictly before the current week).
  while (week < currentWeek) {
    const end = addDays(week, 7);
    const loss = await netLoss(userId, week, end);
    if (loss.gt(0)) {
      const cashback = loss.mul(RATE).div(100);
      await creditCashback(userId, week, loss, cashback);
    } else {
      // Record a zero row so we never rescan this week again.
      await prisma.cashbackPayout
        .create({
          data: { userId, weekStart: week, lossAmount: D(0), rate: D(RATE), cashbackAmount: D(0), balanceAfter: D(0) },
        })
        .catch(() => undefined); // ignore duplicate races
    }
    week = end;
  }
}

async function creditCashback(
  userId: number,
  weekStart: Date,
  loss: Prisma.Decimal,
  cashback: Prisma.Decimal,
): Promise<void> {
  await prisma
    .$transaction(async (tx) => {
      // Idempotency guard inside the txn.
      const exists = await tx.cashbackPayout.findUnique({
        where: { userId_weekStart: { userId, weekStart } },
      });
      if (exists) return;

      const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user) return;
      const balanceAfter = D(user.balance).add(cashback);

      await tx.user.update({ where: { id: userId }, data: { balance: balanceAfter } });
      await tx.cashbackPayout.create({
        data: { userId, weekStart, lossAmount: loss, rate: D(RATE), cashbackAmount: cashback, balanceAfter },
      });
    })
    .catch(() => undefined); // unique violation on race = already credited
}

export interface CashbackStatus {
  rate: number; // 5
  currentWeekLoss: number; // running net loss this week
  pendingCashback: number; // 5% of currentWeekLoss (credited at week end)
  nextPayoutAt: string; // ISO — next Monday 00:00 UTC
  secondsUntilPayout: number;
  lastPayout: { weekStart: string; amount: number } | null;
}

/** Dashboard card: settle due weeks first, then report the live status. */
export async function getCashbackStatus(userId: number, now = new Date()): Promise<CashbackStatus> {
  await settleDueCashback(userId, now);

  const weekStart = weekStartOf(now);
  const nextPayout = addDays(weekStart, 7);
  const loss = await netLoss(userId, weekStart, nextPayout);
  const pending = loss.mul(RATE).div(100);

  const last = await prisma.cashbackPayout.findFirst({
    where: { userId, cashbackAmount: { gt: 0 } },
    orderBy: { weekStart: "desc" },
  });

  return {
    rate: RATE,
    currentWeekLoss: Number(loss),
    pendingCashback: Number(pending),
    nextPayoutAt: nextPayout.toISOString(),
    secondsUntilPayout: Math.max(0, Math.floor((nextPayout.getTime() - now.getTime()) / 1000)),
    lastPayout: last
      ? { weekStart: last.weekStart.toISOString(), amount: Number(last.cashbackAmount) }
      : null,
  };
}
