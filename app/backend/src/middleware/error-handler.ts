import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Route not found"));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
