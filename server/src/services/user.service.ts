import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Forbidden, NotFound } from "../lib/errors.js";
import { canManage } from "../domain/hierarchy.js";
import { sanitize } from "./auth.service.js";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// Direct children of a user (the next level down in the tree), enriched with
// the columns the xbet dashboard table needs: availBalance + childrenCount.
export async function listDownline(actorId: number) {
  const rows = await prisma.user.findMany({
    where: { parentId: actorId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { children: true } } },
  });
  return rows.map((r) => {
    const { _count, ...u } = r;
    const availBalance = D(u.balance).add(u.creditRef).sub(u.exposure);
    return {
      ...sanitize(u),
      // Staff downline tables show the member's plaintext password (panel req).
      passwordText: u.passwordText ?? "",
      childrenCount: _count.children,
      availBalance: availBalance.toString(),
    };
  });
}

// Aggregate totals across the actor's direct downline (the dashboard stats bar).
export async function downlineStats(actorId: number) {
  const agg = await prisma.user.aggregate({
    where: { parentId: actorId },
    _sum: { balance: true, exposure: true, creditRef: true },
    _count: true,
  });
  const balance = D(agg._sum.balance ?? 0);
  const exposure = D(agg._sum.exposure ?? 0);
  const creditRef = D(agg._sum.creditRef ?? 0);
  return {
    totalBalance: balance.toString(),
    totalExposure: exposure.toString(),
    totalAvailBalance: balance.add(creditRef).sub(exposure).toString(),
    count: agg._count,
  };
}

// Whole subtree under a user (recursive CTE — fast on Postgres).
export async function listSubtree(actorId: number) {
  return prisma.$queryRaw<
    Array<{ id: number; username: string; role: string; balance: string; parent_id: number }>
  >`
    WITH RECURSIVE tree AS (
      SELECT id, username, role, balance, parent_id, 1 AS depth
      FROM users WHERE parent_id = ${actorId}
      UNION ALL
      SELECT u.id, u.username, u.role, u.balance, u.parent_id, t.depth + 1
      FROM users u JOIN tree t ON u.parent_id = t.id
    )
    SELECT id, username, role, balance::text AS balance, parent_id FROM tree
    ORDER BY depth, username;
  `;
}

export async function getManagedUser(actorId: number, targetId: number) {
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId } }),
    prisma.user.findUnique({ where: { id: targetId } }),
  ]);
  if (!target) throw NotFound("User not found");
  if (!actor?.role || !target.role) throw Forbidden();
  if (actor.role !== "admin_provider" && !canManage(actor.role, target.role)) {
    throw Forbidden("User is not in your downline");
  }
  return sanitize(target);
}

export async function setStatus(
  actorId: number,
  targetId: number,
  status: "active" | "locked" | "suspended",
) {
  await getManagedUser(actorId, targetId); // authorization
  const updated = await prisma.user.update({ where: { id: targetId }, data: { status } });
  await prisma.auditLog.create({
    data: {
      actorId,
      actorRole: "staff",
      action: "user.status",
      entityType: "user",
      entityId: String(targetId),
      newJson: { status },
    },
  });
  return sanitize(updated);
}
