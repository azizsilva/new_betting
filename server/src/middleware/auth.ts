import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { Forbidden, Unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(Unauthorized("Missing access token"));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(Unauthorized("Invalid or expired token"));
  }
}

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (!roles.includes(req.user.role)) return next(Forbidden("Insufficient permissions"));
    next();
  };
