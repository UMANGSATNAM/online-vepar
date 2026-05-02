import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

function generateCuid(): string {
  // Simple CUID-like ID generator for raw SQL fallback
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 6)
  return `c${timestamp}${random}${random2}`
}

// POST /api/inventory/adjust - Adjust stock for a single product
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, productId, type, quantity, reason, reference } = body

    if (!storeId || !productId || !type || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'storeId, productId, type, and quantity are required' },
        { status: 400 }
      )
    }

    const validTypes = ['in', 'out', 'adjustment', 'return']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: in, out, adjustment, return' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
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

    // Verify product exists and belongs to store
    const product = await db.product.findFirst({
      where: { id: productId, storeId },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found in this store' }, { status: 404 })
    }

    const previousStock = product.stock
    let newStock: number

    switch (type) {
      case 'in':
      case 'return':
        newStock = previousStock + quantity
        break
      case 'out':
        newStock = previousStock - quantity
        if (newStock < 0) newStock = 0
        break
      case 'adjustment':
        newStock = quantity // For adjustment, quantity is the new absolute value
        break
      default:
        newStock = previousStock
    }

    const logQuantity =
      type === 'adjustment'
        ? newStock - previousStock
        : type === 'out'
          ? -quantity
          : quantity

    try {
      // Update product stock and create log in a transaction
      const [updatedProduct, log] = await db.$transaction([
        db.product.update({
          where: { id: productId },
          data: { stock: newStock },
        }),
        db.inventoryLog.create({
          data: {
            productId,
            storeId,
            type,
            quantity: logQuantity,
            previousStock,
            newStock,
            reason: reason || null,
            reference: reference || null,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                stock: true,
              },
            },
          },
        }),
      ])

      return NextResponse.json({
        product: updatedProduct,
        log,
      })
    } catch (modelError) {
      // Fallback to raw SQL if InventoryLog model is not available
      console.warn('InventoryLog model not available, using raw SQL fallback:', modelError)

      // Update the Product stock
      await db.$executeRawUnsafe(
        `UPDATE Product SET stock = ? WHERE id = ?`,
        newStock, productId
      )

      // Insert the inventory log
      const logId = generateCuid()
      await db.$executeRawUnsafe(
        `INSERT INTO InventoryLog (id, productId, storeId, type, quantity, previousStock, newStock, reason, reference, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        logId, productId, storeId, type, logQuantity, previousStock, newStock, reason || null, reference || null
      )

      // Fetch updated product
      const updatedProductRows = await db.$queryRawUnsafe(
        `SELECT id, name, sku, stock FROM Product WHERE id = ?`,
        productId
      ) as Record<string, unknown>[]

      const updatedProduct = updatedProductRows?.[0] || { id: productId, name: product.name, sku: product.sku, stock: newStock }

      const log = {
        id: logId,
        productId,
        storeId,
        type,
        quantity: logQuantity,
        previousStock,
        newStock,
        reason: reason || null,
        reference: reference || null,
        createdAt: new Date().toISOString(),
        product: updatedProduct,
      }

      return NextResponse.json({
        product: updatedProduct,
        log,
      })
    }
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
  }
}
