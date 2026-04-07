import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createAuthService } from "../services/auth-service";

export function createAuthRouter(prisma: PrismaClient) {
  const router = Router();
  const auth = createAuthService(prisma);

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const result = await auth.register(req.body ?? {});
      res.status(201).json(result);
    }),
  );

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const result = await auth.login(req.body ?? {});
      res.json(result);
    }),
  );

  router.get(
    "/me",
    authenticate,
    asyncHandler(async (req, res) => {
      const result = await auth.getCurrentUser(req.auth!.userId);
      res.json(result);
    }),
  );

  return router;
}
