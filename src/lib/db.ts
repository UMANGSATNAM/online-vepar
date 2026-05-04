import { PrismaClient } from '@prisma/client'

// Fix BigInt serialization issue with SQLite + JSON.stringify
// SQLite COUNT() returns BigInt which NextResponse.json() can't serialize
;(BigInt.prototype as any).toJSON = function () {
  return Number(this)
}

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