import { Router } from "express";
import { asyncHandler } from "../middleware/error.js";
import { prisma } from "../lib/prisma.js";

export const settingsRouter = Router();

// Public site settings (logo, social links, login/signup toggles).
settingsRouter.get(
  "/web",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.webSetting.findFirst();
    res.json(settings ?? {});
  }),
);

// Public payment modes enabled for players.
settingsRouter.get(
  "/payment-modes",
  asyncHandler(async (_req, res) => {
    const modes = await prisma.paymentMode.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, channel: true, feePercent: true, feeFlat: true },
    });
    res.json(modes);
  }),
);
