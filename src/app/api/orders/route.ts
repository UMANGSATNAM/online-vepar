import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, generateOrderNumber } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const fulfillmentStatus = searchParams.get('fulfillmentStatus') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    const where: Record<string, unknown> = { storeId };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (fulfillmentStatus) {
      where.fulfillmentStatus = fulfillmentStatus;
    }

    const total = await db.order.count({ where });

    const orders = await db.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId, customerName, customerEmail, customerPhone,
      shippingAddress, billingAddress, notes,
      subtotal, tax, shipping, discount, total,
      items,
      status, paymentStatus, fulfillmentStatus,
    } = body;

    if (!storeId || !customerName || total === undefined || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'storeId, customerName, total, and items are required' },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const orderNumber = generateOrderNumber();

    const order = await db.order.create({
      data: {
        orderNumber,
        status: status || 'pending',
        paymentStatus: paymentStatus || 'unpaid',
        fulfillmentStatus: fulfillmentStatus || 'unfulfilled',
        subtotal: parseFloat(String(subtotal || 0)),
        tax: parseFloat(String(tax || 0)),
        shipping: parseFloat(String(shipping || 0)),
        discount: parseFloat(String(discount || 0)),
        total: parseFloat(String(total)),
        currency: store.currency,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        billingAddress,
        notes,
        storeId,
        userId: user.id,
        items: {
          create: items.map((item: { productId?: string; name: string; price: number; quantity: number; total: number }) => ({
            productId: item.productId,
            name: item.name,
            price: parseFloat(String(item.price)),
            quantity: parseInt(String(item.quantity)),
            total: parseFloat(String(item.total)),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
