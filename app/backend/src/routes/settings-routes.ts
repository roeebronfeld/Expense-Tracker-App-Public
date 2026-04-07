import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createSettingsService } from "../services/settings-service";

export function createSettingsRouter(prisma: PrismaClient) {
  const router = Router();
  const settings = createSettingsService(prisma);

  router.use(authenticate);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await settings.get(req.auth!.userId));
    }),
  );

  router.put(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await settings.update(req.auth!.userId, req.body ?? {}));
    }),
  );

  return router;
}
