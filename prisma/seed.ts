const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Seed Super Admin
  const adminEmail = 'umangsatnam11@gmail.com'
  const adminPassword = 'Umang@4456'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const superadmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'superadmin',
      isSeeded: true,
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'superadmin',
      isSeeded: true,
      emailVerified: true,
    },
  })

  console.log(`Super Admin seeded: ${superadmin.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
