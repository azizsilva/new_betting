import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate } from "../middleware/auth.js";
import * as authService from "../services/auth.service.js";
import { verifyRefreshToken } from "../lib/tokens.js";
import { Unauthorized } from "../lib/errors.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const result = await authService.login(username, password, req.ip);
    res.json(result);
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Unauthorized("Invalid refresh token");
    }
    res.json(authService.refresh(payload));
  }),
);

authRouter.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.id);
    res.json({ ok: true });
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    // Attempt to rescue any stuck V2 Gamblly balance (e.g. user closed tab during Sportsbook)
    import("../services/gambly.service.js").then((s) => s.withdrawGamblyBalance(req.user!.id).catch(() => {}));

    const { prisma } = await import("../lib/prisma.js");
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw Unauthorized();
    
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    res.json(authService.sanitize(user));
  }),
);
