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
  mobile: z.string().max(15).optional(),
  email: z.string().email().optional(),
  role: z.enum(ROLES),
  rate: z.number().min(0).max(100).optional(),
});

// Create a user directly below the actor.
usersRouter.post(
  "/",
  requireRole("bigboss", "admin_provider", "owner", "partner", "super_admin", "admin", "agent"),
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

// GET /users/members/:role — all accounts of that role in the actor's subtree.
usersRouter.get(
  "/members/:role",
  asyncHandler(async (req, res) => {
    const role = z
      .enum(["owner", "partner", "super_admin", "admin", "agent", "player"])
      .parse(req.params.role);
    res.json(await userService.listMembersByRole(req.user!.id, role));
  }),
);

// PATCH /users/:id — edit username / password (hierarchy-gated).
usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().parse(req.params.id);
    const body = z
      .object({
        username: z.string().min(3).max(50).optional(),
        password: z.string().min(4).optional(),
      })
      .parse(req.body);
    res.json(await userService.updateUser(req.user!.id, id, body));
  }),
);
