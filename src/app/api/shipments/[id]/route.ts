import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const shipment = await db.shipment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            shippingAddress: true,
            total: true,
            status: true,
            fulfillmentStatus: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                total: true,
              },
            },
          },
        },
        store: { select: { ownerId: true } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { store: _store, ...shipmentData } = shipment;
    return NextResponse.json({ shipment: shipmentData }, { status: 200 });
  } catch (error) {
    console.error('Get shipment error:', error);
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

    const existing = await db.shipment.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (existing.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { trackingNumber, carrier, shippingMethod, status, weight, dimensions, notes } = body;

    const updateData: Record<string, unknown> = {};

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (carrier !== undefined) updateData.carrier = carrier;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;
    if (weight !== undefined) updateData.weight = weight ? Number(weight) : null;
    if (dimensions !== undefined) updateData.dimensions = dimensions ? (typeof dimensions === 'string' ? dimensions : JSON.stringify(dimensions)) : null;
    if (notes !== undefined) updateData.notes = notes;

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'in_transit' || status === 'picked_up') {
        updateData.shippedAt = new Date();
      }
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
        // Update order fulfillment status
        await db.order.update({
          where: { id: existing.orderId },
          data: { fulfillmentStatus: 'fulfilled', status: 'delivered' },
        });
      }
    }

    const shipment = await db.shipment.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            shippingAddress: true,
            total: true,
            status: true,
            fulfillmentStatus: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                price: true,
                total: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ shipment }, { status: 200 });
  } catch (error) {
    console.error('Update shipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
