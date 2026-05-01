import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/inventory - List inventory logs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    // Verify store belongs to user
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    try {
      const where: Record<string, unknown> = { storeId }

      if (type) {
        where.type = type
      }

      if (productId) {
        where.productId = productId
      }

      if (search) {
        where.product = {
          name: { contains: search },
        }
      }

      const [logs, total] = await Promise.all([
        db.inventoryLog.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                stock: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.inventoryLog.count({ where }),
      ])

      return NextResponse.json({
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (modelError) {
      // Fallback to raw SQL if InventoryLog model is not available
      console.warn('InventoryLog model not available, using raw SQL fallback:', modelError)

      const offset = (page - 1) * limit

      // Build WHERE clause
      let whereClause = 'WHERE il.storeId = ?'
      const whereValues: unknown[] = [storeId]

      if (type) {
        whereClause += ' AND il.type = ?'
        whereValues.push(type)
      }

      if (productId) {
        whereClause += ' AND il.productId = ?'
        whereValues.push(productId)
      }

      if (search) {
        whereClause += ' AND p.name LIKE ?'
        whereValues.push(`%${search}%`)
      }

      // Get logs with product info
      const logsRaw = await db.$queryRawUnsafe(
        `SELECT il.*, p.name as productName, p.sku as productSku, p.images as productImages, p.stock as productStock, p.id as productId
         FROM InventoryLog il
         LEFT JOIN Product p ON il.productId = p.id
         ${whereClause}
         ORDER BY il.createdAt DESC
         LIMIT ? OFFSET ?`,
        ...whereValues, limit, offset
      ) as Record<string, unknown>[]

      // Get total count
      const countResult = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM InventoryLog il
         LEFT JOIN Product p ON il.productId = p.id
         ${whereClause}`,
        ...whereValues
      ) as Record<string, unknown>[]

      const total = Number(countResult?.[0]?.total || 0)

      // Transform raw rows to match expected format
      const logs = logsRaw.map((row) => ({
        id: row.id,
        productId: row.productId,
        storeId: row.storeId,
        type: row.type,
        quantity: row.quantity,
        previousStock: row.previousStock,
        newStock: row.newStock,
        reason: row.reason,
        reference: row.reference,
        createdAt: row.createdAt,
        product: {
          id: row.productId,
          name: row.productName,
          sku: row.productSku,
          images: row.productImages,
          stock: row.productStock,
        },
      }))

      return NextResponse.json({
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }
  } catch (error) {
    console.error('Error fetching inventory logs:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory logs' }, { status: 500 })
  }
}
