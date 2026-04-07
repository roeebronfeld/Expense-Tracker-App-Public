import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createExportService } from "../services/export-service";

export function createDataRouter(prisma: PrismaClient) {
  const router = Router();
  const data = createExportService(prisma);

  router.use(authenticate);

  router.get(
    "/export",
    asyncHandler(async (req, res) => {
      res.json(await data.exportUserData(req.auth!.userId));
    }),
  );

  router.delete(
    "/data/clear-all",
    asyncHandler(async (req, res) => {
      await data.clearUserData(req.auth!.userId);
      res.status(204).send();
    }),
  );

  return router;
}
