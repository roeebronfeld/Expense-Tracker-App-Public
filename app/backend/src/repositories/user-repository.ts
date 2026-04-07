import type { PrismaClient } from "@prisma/client";

export function createUserRepository(prisma: PrismaClient) {
  return {
    findByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },
    findById(id: string) {
      return prisma.user.findUnique({ where: { id } });
    },
    create(data: { email: string; passwordHash: string; fullName: string }) {
      return prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          settings: {
            create: {
              fullName: data.fullName,
              email: data.email,
            },
          },
        },
      });
    },
  };
}
