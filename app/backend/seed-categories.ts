import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Food & Dining" },
  { name: "Transportation" },
  { name: "Shopping" },
  { name: "Entertainment" },
  { name: "Bills & Utilities" },
  { name: "Healthcare" },
  { name: "Travel" },
  { name: "Education" },
  { name: "Other" },
];

async function main() {
  console.log("Seeding categories...");

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash: "seed-only-password",
      fullName: "Demo User",
      settings: {
        create: {
          fullName: "Demo User",
          email: "demo@example.com",
        },
      },
    },
  });

  for (const cat of defaultCategories) {
    await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
      },
    });
    console.log(`Created ${cat.name}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
