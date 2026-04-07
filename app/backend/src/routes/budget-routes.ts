import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createBudgetService } from "../services/budget-service";

export function createBudgetRouter(prisma: PrismaClient) {
  const router = Router();
  const budgets = createBudgetService(prisma);

  router.use(authenticate);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await budgets.list(req.auth!.userId));
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const result = await budgets.create(req.auth!.userId, req.body ?? {});
      res.status(201).json(result);
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json(await budgets.update(req.auth!.userId, req.params.id, req.body ?? {}));
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await budgets.remove(req.auth!.userId, req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
