import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          frameSrc: ["'self'", "https:"],
          connectSrc: ["'self'", "https:"],
        },
      },
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );

  // GLOBAL DEBUG LOGGER to catch literally any request from Gamblly
  const globalDebug: any[] = [];
  app.get("/api/global-debug", (req, res) => res.json(globalDebug));
  app.use((req, res, next) => {
    if (!req.path.includes("debug") && !req.path.includes("auth")) {
      globalDebug.unshift({
        time: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });
      if (globalDebug.length > 50) globalDebug.pop();
    }
    next();
  });

  // Capture the raw request body so seamless-wallet callbacks can verify the
  // HMAC signature over the exact bytes received (doc §7, byte-for-byte).
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Global rate limit; tighten per-route as needed.
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) => req.path.includes("/casino/callback"),
    }),
  );

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
