import type { PrismaClient } from "@prisma/client";
import { createCategoryRepository } from "../repositories/category-repository";
import { createExpenseRepository } from "../repositories/expense-repository";
import { HttpError } from "../lib/http-error";
import { serializeExpense } from "../lib/serializers";

export function createExpenseService(prisma: PrismaClient) {
  const categories = createCategoryRepository(prisma);
  const expenses = createExpenseRepository(prisma);

  return {
    async list(userId: string) {
      const items = await expenses.findManyByUser(userId);
      return { items: items.map(serializeExpense) };
    },

    async create(
      userId: string,
      input: {
        amountCents?: number;
        currency?: string;
        categoryId?: string;
        category?: string;
        merchant?: string | null;
        note?: string | null;
        expenseDate?: string;
      },
    ) {
      if (typeof input.amountCents !== "number" || input.amountCents <= 0) {
        throw new HttpError(400, "amountCents must be a positive number");
      }
      const categoryId = input.categoryId?.trim() ?? input.category?.trim();
      if (!categoryId) {
        throw new HttpError(400, "categoryId is required");
      }

      const category = await categories.findByIdForUser(categoryId, userId);
      if (!category) {
        throw new HttpError(404, "Category not found");
      }

      const item = await expenses.create({
        userId,
        categoryId: category.id,
        amountCents: input.amountCents,
        currency: normalizeCurrency(input.currency),
        merchant: normalizeOptionalString(input.merchant),
        note: normalizeOptionalString(input.note),
        expenseDate: parseDate(input.expenseDate),
      });

      return { item: serializeExpense(item) };
    },

    async update(
      userId: string,
      id: string,
      input: {
        amountCents?: number;
        currency?: string;
        categoryId?: string;
        category?: string;
        merchant?: string | null;
        note?: string | null;
        expenseDate?: string;
      },
    ) {
      const existing = await expenses.findByIdForUser(id, userId);
      if (!existing) {
        throw new HttpError(404, "Expense not found");
      }

      const data: Record<string, unknown> = {};

      if (input.amountCents !== undefined) {
        if (typeof input.amountCents !== "number" || input.amountCents <= 0) {
          throw new HttpError(400, "amountCents must be a positive number");
        }
        data.amountCents = input.amountCents;
      }

      if (input.currency !== undefined) {
        data.currency = normalizeCurrency(input.currency);
      }

      const nextCategoryId = input.categoryId?.trim() ?? input.category?.trim();
      if (input.categoryId !== undefined || input.category !== undefined) {
        const category = await categories.findByIdForUser(nextCategoryId ?? "", userId);
        if (!category) {
          throw new HttpError(404, "Category not found");
        }
        data.categoryId = category.id;
      }

      if (input.merchant !== undefined) {
        data.merchant = normalizeOptionalString(input.merchant);
      }

      if (input.note !== undefined) {
        data.note = normalizeOptionalString(input.note);
      }

      if (input.expenseDate !== undefined) {
        data.expenseDate = parseDate(input.expenseDate);
      }

      if (Object.keys(data).length === 0) {
        throw new HttpError(400, "no fields to update");
      }

      const item = await expenses.update(id, userId, data);
      return { item: serializeExpense(item) };
    },

    async remove(userId: string, id: string) {
      const existing = await expenses.findByIdForUser(id, userId);
      if (!existing) {
        throw new HttpError(404, "Expense not found");
      }

      await expenses.remove(id, userId);
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

function normalizeOptionalString(value?: string | null) {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value?: string) {
  if (!value) {
    return new Date();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "expenseDate must be a valid date");
  }
  return date;
}
