BEGIN;

ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";

ALTER TABLE "Category"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Expense"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "categoryId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Budget"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "UserSettings"
  ADD COLUMN "userId" TEXT;

INSERT INTO "User" ("id", "email", "passwordHash", "fullName", "createdAt", "updatedAt")
SELECT 'default-user', 'demo@example.com', '$2b$10$wP0zr7WRmLQ0m6K4Wwqf1u3h1kQ0L6M7A7mWQmPpCP0h5mU4Z4sNu', 'Demo User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "id" = 'default-user');

UPDATE "Category"
SET "userId" = 'default-user'
WHERE "userId" IS NULL;

UPDATE "Expense" e
SET
  "userId" = 'default-user',
  "categoryId" = c."id"
FROM "Category" c
WHERE e."category" = c."id";

UPDATE "Budget" b
SET "userId" = c."userId"
FROM "Category" c
WHERE b."categoryId" = c."id";

UPDATE "UserSettings"
SET "userId" = 'default-user'
WHERE "userId" IS NULL;

DELETE FROM "UserSettings"
WHERE "userId" IS NULL;

ALTER TABLE "Category"
  ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Expense"
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "Budget"
  ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "UserSettings"
  ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Expense" DROP COLUMN "category";

DROP INDEX IF EXISTS "Budget_categoryId_period_key";
DROP INDEX IF EXISTS "Budget_categoryId_idx";
DROP INDEX IF EXISTS "Category_name_key";

CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
CREATE UNIQUE INDEX "Budget_categoryId_period_key" ON "Budget"("categoryId", "period");

ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_pkey";
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId");
ALTER TABLE "UserSettings" DROP COLUMN "id";

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Budget"
  ADD CONSTRAINT "Budget_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSettings"
  ADD CONSTRAINT "UserSettings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
