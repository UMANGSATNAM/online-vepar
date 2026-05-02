import { db } from '@/lib/db'

type LogAction = {
  storeId: string
  userId?: string
  userName?: string
  action: string
  entity: string
  entityId?: string
  entityName?: string
  details?: Record<string, unknown>
}

export async function logActivity(log: LogAction) {
  try {
    await db.activityLog.create({
      data: {
        storeId: log.storeId,
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        entityName: log.entityName,
        details: log.details ? JSON.stringify(log.details) : null,
      },
    })
  } catch {
    // Fallback to raw SQL if Prisma Client doesn't have ActivityLog model yet
    try {
      await db.$executeRawUnsafe(
        `INSERT INTO ActivityLog (id, storeId, userId, userName, action, entity, entityId, entityName, details, createdAt)
         VALUES (lower(hex(randomblob(8)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        log.storeId, log.userId || null, log.userName || null, log.action, log.entity,
        log.entityId || null, log.entityName || null,
        log.details ? JSON.stringify(log.details) : null
      )
    } catch {
      // Silently fail - logging should not break operations
    }
  }
}
