import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface BulkAdjustment {
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'return'
  quantity: number
  reason?: string
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 6)
  return `c${timestamp}${random}${random2}`
}

// POST /api/inventory/bulk-adjust - Adjust stock for multiple products
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, adjustments, reason } = body as {
      storeId: string
      adjustments: BulkAdjustment[]
      reason?: string
    }

    if (!storeId || !adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json(
        { error: 'storeId and adjustments array are required' },
        { status: 400 }
      )
    }

    if (adjustments.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 adjustments per request' },
        { status: 400 }
      )
    }

    // Verify store belongs to user
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Validate all adjustments
    const validTypes = ['in', 'out', 'adjustment', 'return']
    for (const adj of adjustments) {
      if (!adj.productId || !adj.type || adj.quantity === undefined || adj.quantity === null) {
        return NextResponse.json(
          { error: 'Each adjustment must have productId, type, and quantity' },
          { status: 400 }
        )
      }
      if (!validTypes.includes(adj.type)) {
        return NextResponse.json(
          { error: `Invalid type: ${adj.type}. Must be one of: in, out, adjustment, return` },
          { status: 400 }
        )
      }
      if (typeof adj.quantity !== 'number' || adj.quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be a positive number' },
          { status: 400 }
        )
      }
    }

    // Get all products
    const productIds = adjustments.map((a) => a.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds }, storeId },
    })

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id)
      const missingIds = productIds.filter((id) => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}` },
        { status: 404 }
      )
    }

    try {
      // Execute all adjustments in a transaction
      const results = await db.$transaction(
        adjustments.flatMap((adj) => {
          const product = products.find((p) => p.id === adj.productId)
          if (!product) return []

          const previousStock = product.stock
          let newStock: number

          switch (adj.type) {
            case 'in':
            case 'return':
              newStock = previousStock + adj.quantity
              break
            case 'out':
              newStock = previousStock - adj.quantity
              if (newStock < 0) newStock = 0
              break
            case 'adjustment':
              newStock = adj.quantity
              break
            default:
              newStock = previousStock
          }

          const logQuantity =
            adj.type === 'adjustment'
              ? newStock - previousStock
              : adj.type === 'out'
                ? -adj.quantity
                : adj.quantity

          return [
            db.product.update({
              where: { id: adj.productId },
              data: { stock: newStock },
            }),
            db.inventoryLog.create({
              data: {
                productId: adj.productId,
                storeId,
                type: adj.type,
                quantity: logQuantity,
                previousStock,
                newStock,
                reason: adj.reason || reason || null,
              },
            }),
          ]
        })
      )

      // Extract log entries (every other result)
      const logEntries = results.filter((_, i) => i % 2 === 1)

      return NextResponse.json({
        success: true,
        count: adjustments.length,
        logs: logEntries,
      })
    } catch (modelError) {
      // Fallback to raw SQL if InventoryLog model is not available
      console.warn('InventoryLog model not available, using raw SQL fallback:', modelError)

      const logEntries: Record<string, unknown>[] = []

      for (const adj of adjustments) {
        const product = products.find((p) => p.id === adj.productId)
        if (!product) continue

        const previousStock = product.stock
        let newStock: number

        switch (adj.type) {
          case 'in':
          case 'return':
            newStock = previousStock + adj.quantity
            break
          case 'out':
            newStock = previousStock - adj.quantity
            if (newStock < 0) newStock = 0
            break
          case 'adjustment':
            newStock = adj.quantity
            break
          default:
            newStock = previousStock
        }

        const logQuantity =
          adj.type === 'adjustment'
            ? newStock - previousStock
            : adj.type === 'out'
              ? -adj.quantity
              : adj.quantity

        // Update product stock
        await db.$executeRawUnsafe(
          `UPDATE Product SET stock = ? WHERE id = ?`,
          newStock, adj.productId
        )

        // Insert inventory log
        const logId = generateCuid()
        await db.$executeRawUnsafe(
          `INSERT INTO InventoryLog (id, productId, storeId, type, quantity, previousStock, newStock, reason, reference, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'))`,
          logId, adj.productId, storeId, adj.type, logQuantity, previousStock, newStock, adj.reason || reason || null
        )

        logEntries.push({
          id: logId,
          productId: adj.productId,
          storeId,
          type: adj.type,
          quantity: logQuantity,
          previousStock,
          newStock,
          reason: adj.reason || reason || null,
          reference: null,
          createdAt: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        count: adjustments.length,
        logs: logEntries,
      })
    }
  } catch (error) {
    console.error('Error bulk adjusting inventory:', error)
    return NextResponse.json({ error: 'Failed to bulk adjust inventory' }, { status: 500 })
  }
}
