-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "fullName" TEXT NOT NULL DEFAULT 'Demo User',
    "email" TEXT NOT NULL DEFAULT 'demo@example.com',
    "darkMode" BOOLEAN NOT NULL DEFAULT true,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'ILS',
    "budgetAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);
