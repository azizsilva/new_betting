import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  generateSessionToken,
  signAccessToken,
  signRefreshToken,
  type AccessPayload,
} from "../lib/tokens.js";
import { BadRequest, Forbidden, Unauthorized } from "../lib/errors.js";
import { creatableRoles } from "../domain/hierarchy.js";

function tokensFor(user: { id: number; role: UserRole | null }) {
  const payload: AccessPayload = { sub: user.id, role: user.role ?? "player" };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function login(username: string, password: string, ip?: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw Unauthorized("Invalid credentials");
  if (user.status !== "active") throw Forbidden(`Account is ${user.status}`);

  const ok = await verifyPassword(user.password, password);
  if (!ok) throw Unauthorized("Invalid credentials");

  const sessionToken = generateSessionToken();
  await prisma.user.update({ where: { id: user.id }, data: { sessionToken } });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role ?? "player",
      action: "auth.login",
      entityType: "user",
      entityId: String(user.id),
      ip,
    },
  });

  return { user: sanitize(user), ...tokensFor(user) };
}

export interface CreateUserInput {
  actorId: number;
  username: string;
  password: string;
  mobile: string;
  email?: string;
  role: UserRole;
  rate?: number;
}

// A staff member creates a user directly below them in the tree.
export async function createUser(input: CreateUserInput) {
  const actor = await prisma.user.findUnique({ where: { id: input.actorId } });
  if (!actor || !actor.role) throw Unauthorized();

  if (!creatableRoles(actor.role).includes(input.role)) {
    throw Forbidden(`A ${actor.role} cannot create a ${input.role}`);
  }

  const exists = await prisma.user.findUnique({ where: { username: input.username } });
  if (exists) throw BadRequest("Username already taken");

  const user = await prisma.user.create({
    data: {
      username: input.username,
      password: await hashPassword(input.password),
      mobile: input.mobile,
      email: input.email,
      role: input.role,
      parentId: actor.id,
      rate: input.rate ?? 100,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorRole: actor.role,
      action: "user.create",
      entityType: "user",
      entityId: String(user.id),
      newJson: { username: user.username, role: user.role },
    },
  });

  return sanitize(user);
}

export function refresh(payload: AccessPayload) {
  return tokensFor({ id: payload.sub, role: payload.role });
}

export async function logout(userId: number) {
  await prisma.user.update({ where: { id: userId }, data: { sessionToken: null } });
}

// Strip secrets before returning a user.
export function sanitize<T extends { password: string; passwordText?: string | null }>(u: T) {
  const { password, passwordText, ...safe } = u;
  return safe;
}
