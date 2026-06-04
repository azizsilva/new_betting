import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import * as authService from "../services/auth.service.js";
import * as userService from "../services/user.service.js";

export const usersRouter = Router();
usersRouter.use(authenticate);

const ROLES = [
  "owner",
  "partner",
  "super_admin",
  "admin",
  "agent",
  "player",
] as const;

const createSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4),
  mobile: z.string().min(3).max(15),
  email: z.string().email().optional(),
  role: z.enum(ROLES),
  rate: z.number().min(0).max(100).optional(),
});

// Create a user directly below the actor.
usersRouter.post(
  "/",
  requireRole("admin_provider", "owner", "partner", "super_admin", "admin", "agent"),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const user = await authService.createUser({ actorId: req.user!.id, ...body });
    res.status(201).json(user);
  }),
);

// Direct children.
usersRouter.get(
  "/downline",
  asyncHandler(async (req, res) => {
    res.json(await userService.listDownline(req.user!.id));
  }),
);

// Aggregate totals for the dashboard stats bar.
usersRouter.get(
  "/stats",
  asyncHandler(async (req, res) => {
    res.json(await userService.downlineStats(req.user!.id));
  }),
);

// Full subtree (recursive).
usersRouter.get(
  "/subtree",
  asyncHandler(async (req, res) => {
    res.json(await userService.listSubtree(req.user!.id));
  }),
);

usersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().parse(req.params.id);
    res.json(await userService.getManagedUser(req.user!.id, id));
  }),
);

usersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().parse(req.params.id);
    const { status } = z
      .object({ status: z.enum(["active", "locked", "suspended"]) })
      .parse(req.body);
    res.json(await userService.setStatus(req.user!.id, id, status));
  }),
);
