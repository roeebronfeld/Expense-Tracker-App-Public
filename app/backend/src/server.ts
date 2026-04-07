import express from "express";
import cors from "cors";
import type { PrismaClient } from "@prisma/client";
import { registerRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

export interface AppDependencies {
  prisma: PrismaClient;
}

export function createServer(dependencies: AppDependencies) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  registerRoutes(app, dependencies);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
