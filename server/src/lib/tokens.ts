import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";

export interface AccessPayload {
  sub: number; // userId
  role: UserRole;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessPayload;
}

export function signRefreshToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  } as SignOptions);
}

export function verifyRefreshToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as AccessPayload;
}

// Opaque session token stored on the user row (mirrors xbet_db.session_token).
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
