import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/orders/notes?orderId=xxx
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Verify user owns this store
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const store = await db.store.findFirst({
      where: { id: order.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const notes = await db.orderNote.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error('Get order notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders/notes
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, content, isInternal } = body;

    if (!orderId || !content?.trim()) {
      return NextResponse.json(
        { error: 'orderId and content are required' },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const store = await db.store.findFirst({
      where: { id: order.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const note = await db.orderNote.create({
      data: {
        orderId,
        storeId: order.storeId,
        authorId: user.id,
        authorName: user.name,
        content: content.trim(),
        isInternal: isInternal !== undefined ? isInternal : true,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Create order note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
