import type { PrismaClient, Prisma } from "@prisma/client";

export function createBudgetRepository(prisma: PrismaClient) {
  return {
    findManyByUser(userId: string) {
      return prisma.budget.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      });
    },
    findByIdForUser(id: string, userId: string) {
      return prisma.budget.findFirst({
        where: { id, userId },
        include: { category: true },
      });
    },
    create(data: Prisma.BudgetUncheckedCreateInput) {
      return prisma.budget.create({
        data,
        include: { category: true },
      });
    },
    async update(id: string, userId: string, data: Prisma.BudgetUncheckedUpdateInput) {
      await prisma.budget.updateMany({
        where: { id, userId },
        data,
      });

      return prisma.budget.findFirstOrThrow({
        where: { id, userId },
        include: { category: true },
      });
    },
    remove(id: string, userId: string) {
      return prisma.budget.deleteMany({
        where: { id, userId },
      });
    },
  };
}
