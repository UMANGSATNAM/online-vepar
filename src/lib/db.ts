import { PrismaClient } from '@prisma/client'

// In development, Prisma Client may get stale after schema changes.
// We disconnect the old client before creating a new one.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Disconnect old client if it exists (from previous HMR cycle)
if (globalForPrisma.prisma) {
  try {
    globalForPrisma.prisma.$disconnect()
  } catch {
    // ignore
  }
  globalForPrisma.prisma = undefined
}

export const db = new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db