import type { PrismaClient, Prisma } from "@prisma/client";

export function createExpenseRepository(prisma: PrismaClient) {
  return {
    findManyByUser(userId: string) {
      return prisma.expense.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },
    findByIdForUser(id: string, userId: string) {
      return prisma.expense.findFirst({
        where: { id, userId },
        include: { category: true },
      });
    },
    create(data: Prisma.ExpenseUncheckedCreateInput) {
      return prisma.expense.create({
        data,
        include: { category: true },
      });
    },
    async update(id: string, userId: string, data: Prisma.ExpenseUncheckedUpdateInput) {
      await prisma.expense.updateMany({
        where: { id, userId },
        data,
      });

      return prisma.expense.findFirstOrThrow({
        where: { id, userId },
        include: { category: true },
      });
    },
    remove(id: string, userId: string) {
      return prisma.expense.deleteMany({
        where: { id, userId },
      });
    },
  };
}
