import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/inventory/low-stock - Get products with low stock
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const threshold = parseInt(searchParams.get('threshold') || '10')

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
      const products = await db.product.findMany({
        where: {
          storeId,
          stock: { lte: threshold },
          trackInventory: true,
          status: 'active',
        },
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          images: true,
          price: true,
          status: true,
          category: true,
          updatedAt: true,
        },
      })

      return NextResponse.json({
        products,
        threshold,
        count: products.length,
      })
    } catch (modelError) {
      // Fallback to raw SQL if Product model's complex query is not available
      console.warn('Product model query failed, using raw SQL fallback:', modelError)

      const products = await db.$queryRawUnsafe(
        `SELECT * FROM Product WHERE storeId = ? AND stock <= ? AND status = 'active' ORDER BY stock ASC`,
        storeId, threshold
      ) as Record<string, unknown>[]

      return NextResponse.json({
        products,
        threshold,
        count: products.length,
      })
    }
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json({ error: 'Failed to fetch low stock products' }, { status: 500 })
  }
}
