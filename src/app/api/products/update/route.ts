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

    const { storeId, productId, price, stock, status } = await request.json();

    if (!storeId || !productId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { ownerId: userId },
          { staffs: { some: { userId: userId } } }
        ]
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found or unauthorized' }, { status: 403 });
    }

    // Update product
    const product = await db.product.update({
      where: { id: productId, storeId: storeId },
      data: { 
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        status: status || 'active',
      },
    });

    await logActivity({
      storeId,
      userId,
      action: 'Updated Product',
      details: `Updated product ${product.name} details via mobile app`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Product Update API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
