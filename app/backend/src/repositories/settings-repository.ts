import type { PrismaClient, Prisma } from "@prisma/client";

type SettingsWriteInput = Omit<Prisma.UserSettingsUncheckedCreateInput, "userId">;

export function createSettingsRepository(prisma: PrismaClient) {
  return {
    findByUserId(userId: string) {
      return prisma.userSettings.findUnique({
        where: { userId },
      });
    },
    upsert(userId: string, data: SettingsWriteInput) {
      return prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        },
      });
    },
  };
}
