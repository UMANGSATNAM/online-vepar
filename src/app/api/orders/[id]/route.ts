import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: order.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const existingOrder = await db.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: existingOrder.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status, paymentStatus, fulfillmentStatus,
      customerName, customerEmail, customerPhone,
      shippingAddress, billingAddress, notes,
      subtotal, tax, shipping, discount, total,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (fulfillmentStatus !== undefined) updateData.fulfillmentStatus = fulfillmentStatus;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress;
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress;
    if (notes !== undefined) updateData.notes = notes;
    if (subtotal !== undefined) updateData.subtotal = parseFloat(String(subtotal));
    if (tax !== undefined) updateData.tax = parseFloat(String(tax));
    if (shipping !== undefined) updateData.shipping = parseFloat(String(shipping));
    if (discount !== undefined) updateData.discount = parseFloat(String(discount));
    if (total !== undefined) updateData.total = parseFloat(String(total));

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const existingOrder = await db.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: existingOrder.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.order.delete({ where: { id } });

    return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
