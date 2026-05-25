import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@store.test" },
    update: {},
    create: {
      email: "admin@store.test",
      passwordHash: adminPassword,
      name: "Admin",
      role: "admin",
    },
  });

  const products = [
    { name: "Classic T-Shirt", description: "A comfortable cotton t-shirt.", price: 29.99 },
    { name: "Denim Jacket", description: "Timeless denim jacket for any wardrobe.", price: 89.99 },
    { name: "Running Shoes", description: "Lightweight shoes for daily runs.", price: 119.99 },
    { name: "Leather Backpack", description: "Handcrafted leather backpack.", price: 149.99 },
    { name: "Wireless Headphones", description: "Noise-cancelling over-ear headphones.", price: 249.99 },
  ];

  const existing = await prisma.product.findFirst();
  if (!existing) {
    await prisma.product.createMany({ data: products });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
