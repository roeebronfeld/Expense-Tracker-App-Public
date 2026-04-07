import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createCategoryService } from "../services/category-service";

export function createCategoryRouter(prisma: PrismaClient) {
  const router = Router();
  const categories = createCategoryService(prisma);

  router.use(authenticate);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await categories.list(req.auth!.userId));
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const result = await categories.create(req.auth!.userId, req.body ?? {});
      res.status(201).json(result);
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json(await categories.update(req.auth!.userId, req.params.id, req.body ?? {}));
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await categories.remove(req.auth!.userId, req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
