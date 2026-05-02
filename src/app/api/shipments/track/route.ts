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
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber is required' }, { status: 400 });
    }

    const shipment = await db.shipment.findFirst({
      where: { trackingNumber },
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
        store: { select: { id: true, name: true, ownerId: true } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build tracking timeline
    const statusSteps = [
      { key: 'label_created', label: 'Label Created', description: 'Shipping label has been created' },
      { key: 'picked_up', label: 'Picked Up', description: 'Package has been picked up by carrier' },
      { key: 'in_transit', label: 'In Transit', description: 'Package is on its way' },
      { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Package is out for delivery' },
      { key: 'delivered', label: 'Delivered', description: 'Package has been delivered' },
    ];

    const statusOrder = ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const currentIdx = statusOrder.indexOf(shipment.status);

    const timeline = statusSteps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIdx,
      current: step.key === shipment.status,
      timestamp: idx === currentIdx ? shipment.updatedAt : (idx < currentIdx ? shipment.createdAt : null),
    }));

    // Add failed/returned status if applicable
    if (shipment.status === 'failed') {
      timeline.push({
        key: 'failed',
        label: 'Delivery Failed',
        description: 'Delivery attempt was unsuccessful',
        completed: true,
        current: true,
        timestamp: shipment.updatedAt,
      });
    } else if (shipment.status === 'returned') {
      timeline.push({
        key: 'returned',
        label: 'Returned',
        description: 'Package has been returned',
        completed: true,
        current: true,
        timestamp: shipment.updatedAt,
      });
    }

    const { store: _store, ...shipmentData } = shipment;

    return NextResponse.json({
      shipment: shipmentData,
      timeline,
    }, { status: 200 });
  } catch (error) {
    console.error('Track shipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
