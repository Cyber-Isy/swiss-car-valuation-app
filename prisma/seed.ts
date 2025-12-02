import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@swisscarmarket.ch" },
    update: {},
    create: {
      email: "admin@swisscarmarket.ch",
      password: hashedPassword,
      name: "Admin",
    },
  })

  console.log("Admin user created:", admin.email)
  console.log("Password: admin123")
  console.log("(Change this in production!)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
