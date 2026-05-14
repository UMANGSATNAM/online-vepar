import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, orderId, status } = await request.json();

    if (!storeId || !orderId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { ownerId: userId },
          { staffs: { some: { user: { id: userId } } } }
        ]
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found or unauthorized' }, { status: 403 });
    }

    // Update order status
    const order = await db.order.update({
      where: { id: orderId, storeId: storeId },
      data: { fulfillmentStatus: status },
    });

    await logActivity({
      storeId,
      userId,
      action: 'Updated Order Status',
      details: `Updated order ${order.orderNumber} to ${status}`,
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order Update API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
