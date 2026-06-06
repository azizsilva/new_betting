import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { Forbidden, Unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole };
      rawBody?: Buffer; // set by express.json verify hook for HMAC verification
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(Unauthorized("Missing access token"));

  try {
    const payload = verifyAccessToken(token);
    
    // Check if session token matches the one in DB to prevent multiple logins
    if (payload.sid) {
      const { prisma } = await import("../lib/prisma.js");
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { sessionToken: true }
      });
      if (!user || user.sessionToken !== payload.sid) {
        return next(Unauthorized("SESSION_OVERRIDDEN"));
      }
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(Unauthorized("Invalid or expired token"));
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (!roles.includes(req.user.role)) return next(Forbidden("Insufficient permissions"));
    next();
  };
