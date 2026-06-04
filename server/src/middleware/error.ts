import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: { code: "VALIDATION", message: "Validation failed", details: err.flatten() },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code ?? "ERROR", message: err.message, details: err.details },
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL", message: "Internal server error" },
  });
}

// Wrap async route handlers so thrown errors reach the error middleware.
export const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
