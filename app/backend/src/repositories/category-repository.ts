import type { PrismaClient } from "@prisma/client";

export function createCategoryRepository(prisma: PrismaClient) {
  return {
    findManyByUser(userId: string) {
      return prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });
    },
    findByIdForUser(id: string, userId: string) {
      return prisma.category.findFirst({
        where: { id, userId },
      });
    },
    create(userId: string, name: string) {
      return prisma.category.create({
        data: { userId, name },
      });
    },
    async update(id: string, userId: string, name: string) {
      await prisma.category.updateMany({
        where: { id, userId },
        data: { name },
      });

      return prisma.category.findFirstOrThrow({
        where: { id, userId },
      });
    },
    remove(id: string, userId: string) {
      return prisma.category.deleteMany({
        where: { id, userId },
      });
    },
    createDefaults(userId: string, categories: ReadonlyArray<{ name: string }>) {
      return prisma.category.createMany({
        data: categories.map((category) => ({
          userId,
          name: category.name,
        })),
        skipDuplicates: true,
      });
    },
  };
}
