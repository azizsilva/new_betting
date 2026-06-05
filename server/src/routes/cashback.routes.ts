import { Router } from "express";
import { asyncHandler } from "../middleware/error.js";
import { authenticate } from "../middleware/auth.js";
import { getCashbackStatus } from "../services/cashback.service.js";

export const cashbackRouter = Router();

// Player's weekly cashback status (auto-settles any completed weeks first, so
// last week's 5% is credited to the balance on the first load after reset).
cashbackRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await getCashbackStatus(req.user!.id);
    res.json(status);
  }),
);
