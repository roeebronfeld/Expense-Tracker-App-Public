import { Router } from "express";

const BUILD_VERSION = "3.0.0";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ ok: true, version: BUILD_VERSION });
});
