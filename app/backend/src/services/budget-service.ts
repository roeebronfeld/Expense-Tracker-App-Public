import type { PrismaClient } from "@prisma/client";
import { createBudgetRepository } from "../repositories/budget-repository";
import { createCategoryRepository } from "../repositories/category-repository";
import { HttpError } from "../lib/http-error";
import { serializeBudget } from "../lib/serializers";

export function createBudgetService(prisma: PrismaClient) {
  const budgets = createBudgetRepository(prisma);
  const categories = createCategoryRepository(prisma);

  return {
    async list(userId: string) {
      const items = await budgets.findManyByUser(userId);
      return { items: items.map(serializeBudget) };
    },

    async create(
      userId: string,
      input: { categoryId?: string; amountCents?: number; currency?: string; period?: string },
    ) {
      if (typeof input.amountCents !== "number" || input.amountCents <= 0) {
        throw new HttpError(400, "amountCents must be a positive number");
      }
      if (!input.categoryId?.trim()) {
        throw new HttpError(400, "categoryId is required");
      }

      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) {
        throw new HttpError(404, "Category not found");
      }

      try {
        const item = await budgets.create({
          userId,
          categoryId: category.id,
          amountCents: input.amountCents,
          currency: normalizeCurrency(input.currency),
          period: normalizePeriod(input.period),
        });
        return { item: serializeBudget(item) };
      } catch (error: any) {
        if (error?.code === "P2002") {
          throw new HttpError(409, "Budget already exists for this category and period");
        }
        throw error;
      }
    },

    async update(
      userId: string,
      id: string,
      input: { categoryId?: string; amountCents?: number; currency?: string; period?: string },
    ) {
      const existing = await budgets.findByIdForUser(id, userId);
      if (!existing) {
        throw new HttpError(404, "Budget not found");
      }

      const data: Record<string, unknown> = {};

      if (input.amountCents !== undefined) {
        if (typeof input.amountCents !== "number" || input.amountCents <= 0) {
          throw new HttpError(400, "amountCents must be a positive number");
        }
        data.amountCents = input.amountCents;
      }

      if (input.categoryId !== undefined) {
        const category = await categories.findByIdForUser(input.categoryId, userId);
        if (!category) {
          throw new HttpError(404, "Category not found");
        }
        data.categoryId = category.id;
      }

      if (input.currency !== undefined) {
        data.currency = normalizeCurrency(input.currency);
      }

      if (input.period !== undefined) {
        data.period = normalizePeriod(input.period);
      }

      if (Object.keys(data).length === 0) {
        throw new HttpError(400, "no fields to update");
      }

      try {
        const item = await budgets.update(id, userId, data);
        return { item: serializeBudget(item) };
      } catch (error: any) {
        if (error?.code === "P2002") {
          throw new HttpError(409, "Budget already exists for this category and period");
        }
        throw error;
      }
    },

    async remove(userId: string, id: string) {
      const existing = await budgets.findByIdForUser(id, userId);
      if (!existing) {
        throw new HttpError(404, "Budget not found");
      }

      await budgets.remove(id, userId);
    },
  };
}

function normalizeCurrency(currency?: string) {
  const value = currency?.trim();
  if (!value) {
    return "ILS";
  }
  return value.toUpperCase();
}

function normalizePeriod(period?: string) {
  const value = period?.trim();
  if (!value) {
    return "monthly";
  }
  return value.toLowerCase();
}
