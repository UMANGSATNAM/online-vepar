import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get total revenue (sum of all paid orders)
    const revenueResult = await db.order.aggregate({
      where: { storeId, paymentStatus: 'paid' },
      _sum: { total: true },
    });

    const totalRevenue = revenueResult._sum.total || 0;

    // Get orders count
    const totalOrders = await db.order.count({
      where: { storeId },
    });

    // Get products count
    const totalProducts = await db.product.count({
      where: { storeId },
    });

    // Get active products count
    const activeProducts = await db.product.count({
      where: { storeId, status: 'active' },
    });

    // Get customers count
    const totalCustomers = await db.customer.count({
      where: { storeId },
    });

    // Get recent orders (last 10)
    const recentOrders = await db.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: true,
      },
    });

    // Get orders by status
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      where: { storeId },
      _count: { status: true },
    });

    // Get monthly revenue for the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const orders = await db.order.findMany({
      where: {
        storeId,
        paymentStatus: 'paid',
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by month
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthTotal = orders
        .filter(o => o.createdAt >= monthStart && o.createdAt <= monthEnd)
        .reduce((sum, o) => sum + o.total, 0);

      monthlyRevenue.push({
        month: monthStr,
        revenue: Math.round(monthTotal * 100) / 100,
      });
    }

    // Get top products by order count
    const topProducts = await db.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { storeId },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.filter(p => p.productId).map(async (p) => {
        const product = await db.product.findUnique({
          where: { id: p.productId! },
          select: { id: true, name: true, images: true, price: true },
        });
        return {
          ...product,
          totalQuantity: p._sum.quantity,
          totalRevenue: p._sum.total,
        };
      })
    );

    // Get pending orders count
    const pendingOrders = await db.order.count({
      where: { storeId, status: 'pending' },
    });

    // Get unfulfilled orders count
    const unfulfilledOrders = await db.order.count({
      where: { storeId, fulfillmentStatus: 'unfulfilled' },
    });

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        activeProducts,
        totalCustomers,
        pendingOrders,
        unfulfilledOrders,
      },
      recentOrders,
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s._count.status,
      })),
      monthlyRevenue,
      topProducts: topProductsWithDetails,
    }, { status: 200 });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
