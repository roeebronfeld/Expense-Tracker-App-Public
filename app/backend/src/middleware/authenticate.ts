import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { HttpError } from "../lib/http-error";

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication required"));
  }

  const token = header.replace("Bearer ", "").trim();

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
    };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}
