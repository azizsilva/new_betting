import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { usersRouter } from "./users.routes.js";
import { walletRouter } from "./wallet.routes.js";
import { casinoRouter } from "./casino.routes.js";
import { gamblyRouter } from "./gambly.routes.js";
import { cashbackRouter } from "./cashback.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { providersConfigured } from "../providers/index.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, providers: providersConfigured, ts: Date.now() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/casino", casinoRouter);
apiRouter.use("/gambly", gamblyRouter);
apiRouter.use("/cashback", cashbackRouter);
apiRouter.use("/settings", settingsRouter);
