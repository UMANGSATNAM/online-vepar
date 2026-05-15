import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyStoreAccess } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { updates, storeId } = await request.json();

    if (!storeId || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { authorized } = await verifyStoreAccess(storeId, user.id, 'products');
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Bulk update within a transaction
    const updatePromises = updates.map((update: { id: string; stock: number }) => 
      db.product.update({
        where: { id: update.id, storeId }, // Ensure we only update products belonging to this store
        data: { stock: update.stock },
      })
    );

    await db.$transaction(updatePromises);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Inventory bulk update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
