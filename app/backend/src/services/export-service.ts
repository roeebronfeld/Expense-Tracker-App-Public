import type { PrismaClient } from "@prisma/client";

export function createExportService(prisma: PrismaClient) {
  return {
    async exportUserData(userId: string) {
      const [expenses, categories, budgets, settings] = await Promise.all([
        prisma.expense.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { expenseDate: "desc" },
        }),
        prisma.category.findMany({
          where: { userId },
          orderBy: { name: "asc" },
        }),
        prisma.budget.findMany({
          where: { userId },
          include: { category: true },
        }),
        prisma.userSettings.findUnique({
          where: { userId },
        }),
      ]);

      return {
        exportDate: new Date().toISOString(),
        expenses,
        categories,
        budgets,
        settings,
      };
    },

    async clearUserData(userId: string) {
      await prisma.$transaction([
        prisma.budget.deleteMany({ where: { userId } }),
        prisma.expense.deleteMany({ where: { userId } }),
        prisma.category.deleteMany({ where: { userId } }),
        prisma.userSettings.deleteMany({ where: { userId } }),
      ]);
    },
  };
}
