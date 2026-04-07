import type { PrismaClient } from "@prisma/client";
import { createCategoryRepository } from "../repositories/category-repository";
import { HttpError } from "../lib/http-error";

export function createCategoryService(prisma: PrismaClient) {
  const categories = createCategoryRepository(prisma);

  return {
    async list(userId: string) {
      return { items: await categories.findManyByUser(userId) };
    },

    async create(userId: string, input: { name?: string }) {
      const name = input.name?.trim();
      if (!name) {
        throw new HttpError(400, "name is required");
      }

      try {
        const item = await categories.create(userId, name);
        return { item };
      } catch (error: any) {
        if (error?.code === "P2002") {
          throw new HttpError(409, "Category name already exists");
        }
        throw error;
      }
    },

    async update(userId: string, id: string, input: { name?: string }) {
      const name = input.name?.trim();
      if (!name) {
        throw new HttpError(400, "name is required");
      }

      try {
        const item = await categories.update(id, userId, name);
        return { item };
      } catch (error: any) {
        if (error?.code === "P2025") {
          throw new HttpError(404, "Category not found");
        }
        if (error?.code === "P2002") {
          throw new HttpError(409, "Category name already exists");
        }
        throw error;
      }
    },

    async remove(userId: string, id: string) {
      const existing = await categories.findByIdForUser(id, userId);
      if (!existing) {
        throw new HttpError(404, "Category not found");
      }

      try {
        await categories.remove(id, userId);
      } catch (error: any) {
        if (error?.code === "P2025") {
          throw new HttpError(404, "Category not found");
        }
        throw error;
      }
    },
  };
}
