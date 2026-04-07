import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { createExpenseService } from "../services/expense-service";

export function createExpenseRouter(prisma: PrismaClient) {
  const router = Router();
  const expenses = createExpenseService(prisma);

  router.use(authenticate);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await expenses.list(req.auth!.userId));
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const result = await expenses.create(req.auth!.userId, req.body ?? {});
      res.status(201).json(result);
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      res.json(await expenses.update(req.auth!.userId, req.params.id, req.body ?? {}));
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await expenses.remove(req.auth!.userId, req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
