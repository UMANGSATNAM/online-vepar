import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface Notification {
  id: string;
  type: 'new_order' | 'low_stock' | 'payment_received' | 'order_status';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const stores = await db.store.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });

    const storeIds = stores.map((s) => s.id);
    if (storeIds.length === 0) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications: Notification[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Recent orders (last 7 days) -> "New order from {customerName}"
    const recentOrders = await db.order.findMany({
      where: {
        storeId: { in: storeIds },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const order of recentOrders) {
      notifications.push({
        id: `order-new-${order.id}`,
        type: 'new_order',
        title: 'New order received',
        description: `Order #${order.orderNumber} from ${order.customerName}`,
        time: timeAgo(order.createdAt),
        read: notifications.length >= 3,
        link: 'orders',
      });
    }

    // Products with stock <= 5 -> "Low stock: {productName} ({stock} left)"
    const lowStockProducts = await db.product.findMany({
      where: {
        storeId: { in: storeIds },
        stock: { lte: 5 },
        status: 'active',
      },
      take: 10,
    });

    for (const product of lowStockProducts) {
      notifications.push({
        id: `stock-low-${product.id}`,
        type: 'low_stock',
        title: 'Low stock alert',
        description: `${product.name} (${product.stock} left)`,
        time: timeAgo(product.updatedAt),
        read: false,
        link: 'products',
      });
    }

    // Paid orders -> "Payment received: ₹{amount} from {customerName}"
    const paidOrders = await db.order.findMany({
      where: {
        storeId: { in: storeIds },
        paymentStatus: 'paid',
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const order of paidOrders) {
      notifications.push({
        id: `payment-${order.id}`,
        type: 'payment_received',
        title: 'Payment received',
        description: `₹${order.total.toLocaleString('en-IN')} from ${order.customerName}`,
        time: timeAgo(order.createdAt),
        read: true,
        link: 'orders',
      });
    }

    // Unfulfilled orders -> "Order #{orderNumber} needs fulfillment"
    const unfulfilledOrders = await db.order.findMany({
      where: {
        storeId: { in: storeIds },
        fulfillmentStatus: 'unfulfilled',
        status: { notIn: ['cancelled', 'refunded'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const order of unfulfilledOrders) {
      notifications.push({
        id: `fulfill-${order.id}`,
        type: 'order_status',
        title: 'Order needs fulfillment',
        description: `Order #${order.orderNumber} is awaiting fulfillment`,
        time: timeAgo(order.createdAt),
        read: false,
        link: 'orders',
      });
    }

    // Sort by recency (newest first) - use a simple sort based on the time string
    // Since we can't easily sort by timeAgo string, we just return them in the order added
    // (recent orders first, then low stock, then payments, then unfulfilled)

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
