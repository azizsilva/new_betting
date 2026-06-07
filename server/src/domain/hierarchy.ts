import type { UserRole } from "@prisma/client";

// Ordered top → bottom. Lower index = more authority.
//   admin_provider → owner → partner → super_admin → admin → agent → player
export const ROLE_ORDER: UserRole[] = [
  "bigboss",
  "admin_provider",
  "owner",
  "partner",
  "super_admin",
  "admin",
  "agent",
  "player",
];

export const rank = (role: UserRole): number => {
  const i = ROLE_ORDER.indexOf(role);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i; // "provider" sorts last
};

// The role a parent creates directly beneath itself.
export function childRole(parentRole: UserRole): UserRole | null {
  const i = ROLE_ORDER.indexOf(parentRole);
  if (i === -1 || i >= ROLE_ORDER.length - 1) return null;
  return ROLE_ORDER[i + 1]!;
}

// Can `actor` act on a user of `targetRole`? Strictly higher in the tree.
export function canManage(actorRole: UserRole, targetRole: UserRole): boolean {
  return rank(actorRole) < rank(targetRole);
}

// Roles an actor is allowed to create. EVERY role can create ANY role strictly
// below it in the chain (xbet: "eli ta7t sa7bo ynajem ycreati el kol").
//   admin_provider → owner, partner, super_admin, admin, agent, player
//   owner          → partner, super_admin, admin, agent, player
//   partner        → super_admin, admin, agent, player
//   …
//   agent          → player
export function creatableRoles(actorRole: UserRole): UserRole[] {
  const i = ROLE_ORDER.indexOf(actorRole);
  if (i === -1 || i >= ROLE_ORDER.length - 1) return [];
  return ROLE_ORDER.slice(i + 1);
}

export const isPlayer = (role: UserRole) => role === "player";
export const isStaff = (role: UserRole) => role !== "player" && role !== "provider";
