import type { PrismaClient } from "@prisma/client";
import { createSettingsRepository } from "../repositories/settings-repository";
import { createUserRepository } from "../repositories/user-repository";

export function createSettingsService(prisma: PrismaClient) {
  const settings = createSettingsRepository(prisma);
  const users = createUserRepository(prisma);

  return {
    async get(userId: string) {
      const item = await settings.findByUserId(userId);
      if (item) {
        return { settings: item };
      }

      const user = await users.findById(userId);
      const created = await settings.upsert(userId, {
        fullName: user?.fullName ?? "Demo User",
        email: user?.email ?? "demo@example.com",
        darkMode: true,
        defaultCurrency: "ILS",
        budgetAlerts: true,
        weeklySummary: false,
        monthlyIncomeCents: 0,
      });

      return { settings: created };
    },

    async update(
      userId: string,
      input: {
        fullName?: string;
        email?: string;
        darkMode?: boolean;
        defaultCurrency?: string;
        budgetAlerts?: boolean;
        weeklySummary?: boolean;
        monthlyIncomeCents?: number;
      },
    ) {
      const updated = await settings.upsert(userId, {
        ...(input.fullName !== undefined && { fullName: input.fullName.trim() }),
        ...(input.email !== undefined && { email: input.email.trim().toLowerCase() }),
        ...(input.darkMode !== undefined && { darkMode: input.darkMode }),
        ...(input.defaultCurrency !== undefined && {
          defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
        }),
        ...(input.budgetAlerts !== undefined && { budgetAlerts: input.budgetAlerts }),
        ...(input.weeklySummary !== undefined && { weeklySummary: input.weeklySummary }),
        ...(input.monthlyIncomeCents !== undefined && {
          monthlyIncomeCents: input.monthlyIncomeCents,
        }),
      });

      return { settings: updated };
    },
  };
}
