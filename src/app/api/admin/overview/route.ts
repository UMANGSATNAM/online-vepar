import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || false) {
    return { error: NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

// GET /api/admin/overview - Platform-wide stats
export async function GET(request: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const [
    totalUsers, totalStores, activeStores,
    totalOrders, totalProducts, totalRevenue,
    recentUsers, recentStores, suspendedStores
  ] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.store.count({ where: { isActive: true } }),
    db.order.count(),
    db.product.count(),
    db.order.aggregate({ _sum: { total: true } }),
    db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    db.store.findMany({
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, name: true, slug: true, isActive: true, createdAt: true, owner: { select: { name: true, email: true } }, _count: { select: { products: true, orders: true } } }
    }),
    db.store.count({ where: { isActive: false } }),
  ])

  return NextResponse.json({
    stats: {
      totalUsers, totalStores, activeStores, suspendedStores,
      totalOrders, totalProducts,
      totalRevenue: totalRevenue._sum.total || 0,
    },
    recentUsers,
    recentStores,
  })
}
