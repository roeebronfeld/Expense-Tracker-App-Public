import type { Express } from "express";
import type { AppDependencies } from "../server";
import { healthRouter } from "./health-routes";
import { createAuthRouter } from "./auth-routes";
import { createCategoryRouter } from "./category-routes";
import { createExpenseRouter } from "./expense-routes";
import { createBudgetRouter } from "./budget-routes";
import { createSettingsRouter } from "./settings-routes";
import { createDataRouter } from "./data-routes";

export function registerRoutes(app: Express, dependencies: AppDependencies) {
  app.use(healthRouter);
  app.use("/api/auth", createAuthRouter(dependencies.prisma));
  app.use("/api/categories", createCategoryRouter(dependencies.prisma));
  app.use("/api/expenses", createExpenseRouter(dependencies.prisma));
  app.use("/api/budgets", createBudgetRouter(dependencies.prisma));
  app.use("/api/settings", createSettingsRouter(dependencies.prisma));
  app.use("/api", createDataRouter(dependencies.prisma));
}
