import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 6);
  return `c${timestamp}${random}${random2}`;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

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

    try {
      const where: Record<string, unknown> = { storeId };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { trackingNumber: { contains: search } },
          { carrier: { contains: search } },
          { order: { orderNumber: { contains: search } } },
          { order: { customerName: { contains: search } } },
        ];
      }

      const shipments = await db.shipment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              total: true,
              status: true,
              fulfillmentStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ shipments }, { status: 200 });
    } catch (modelError) {
      // Fallback to raw SQL if Shipment model is not available
      console.warn('Shipment model not available, using raw SQL fallback:', modelError);

      let whereClause = 'WHERE s.storeId = ?';
      const whereValues: unknown[] = [storeId];

      if (status) {
        whereClause += ' AND s.status = ?';
        whereValues.push(status);
      }

      if (search) {
        whereClause += ` AND (s.trackingNumber LIKE ? OR s.carrier LIKE ? OR o.orderNumber LIKE ? OR o.customerName LIKE ?)`;
        const searchPattern = `%${search}%`;
        whereValues.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const shipmentsRaw = await db.$queryRawUnsafe(
        `SELECT s.*, o.id as orderId, o.orderNumber, o.customerName, o.customerEmail, o.total as orderTotal, o.status as orderStatus, o.fulfillmentStatus as orderFulfillmentStatus
         FROM Shipment s
         LEFT JOIN "Order" o ON s.orderId = o.id
         ${whereClause}
         ORDER BY s.createdAt DESC`,
        ...whereValues
      ) as Record<string, unknown>[];

      // Transform to match expected format with nested order object
      const shipments = shipmentsRaw.map((row) => {
        const {
          orderId, orderNumber, customerName, customerEmail,
          orderTotal, orderStatus, orderFulfillmentStatus,
          ...shipmentData
        } = row;

        return {
          ...shipmentData,
          order: {
            id: orderId,
            orderNumber,
            customerName,
            customerEmail,
            total: orderTotal,
            status: orderStatus,
            fulfillmentStatus: orderFulfillmentStatus,
          },
        };
      });

      return NextResponse.json({ shipments }, { status: 200 });
    }
  } catch (error) {
    console.error('Get shipments error:', error);
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
    const { storeId, orderId, carrier, shippingMethod, weight, dimensions, notes, trackingNumber } = body;

    if (!storeId || !orderId) {
      return NextResponse.json(
        { error: 'storeId and orderId are required' },
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

    // Verify order belongs to this store
    const order = await db.order.findFirst({
      where: { id: orderId, storeId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found in this store' }, { status: 404 });
    }

    // Generate tracking number if not provided
    const generatedTracking = trackingNumber || `OV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      const shipment = await db.shipment.create({
        data: {
          storeId,
          orderId,
          trackingNumber: generatedTracking,
          carrier: carrier || null,
          shippingMethod: shippingMethod || null,
          weight: weight ? Number(weight) : null,
          dimensions: dimensions ? (typeof dimensions === 'string' ? dimensions : JSON.stringify(dimensions)) : null,
          notes: notes || null,
          status: 'label_created',
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              total: true,
              status: true,
              fulfillmentStatus: true,
            },
          },
        },
      });

      // Update order fulfillment status
      await db.order.update({
        where: { id: orderId },
        data: { fulfillmentStatus: 'partial', status: 'processing' },
      });

      return NextResponse.json({ shipment }, { status: 201 });
    } catch (modelError) {
      // Fallback to raw SQL if Shipment model is not available
      console.warn('Shipment model not available, using raw SQL fallback:', modelError);

      const shipmentId = generateCuid();
      const dimensionsStr = dimensions
        ? (typeof dimensions === 'string' ? dimensions : JSON.stringify(dimensions))
        : null;

      await db.$executeRawUnsafe(
        `INSERT INTO Shipment (id, orderId, storeId, trackingNumber, carrier, shippingMethod, status, weight, dimensions, notes, shippedAt, deliveredAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'label_created', ?, ?, ?, NULL, NULL, datetime('now'), datetime('now'))`,
        shipmentId, orderId, storeId, generatedTracking, carrier || null, shippingMethod || null,
        weight ? Number(weight) : null, dimensionsStr, notes || null
      );

      // Update order fulfillment status
      await db.$executeRawUnsafe(
        `UPDATE "Order" SET fulfillmentStatus = 'partial', status = 'processing', updatedAt = datetime('now') WHERE id = ?`,
        orderId
      );

      // Fetch the created shipment with order info
      const shipmentRows = await db.$queryRawUnsafe(
        `SELECT s.*, o.id as orderId, o.orderNumber, o.customerName, o.customerEmail, o.total as orderTotal, o.status as orderStatus, o.fulfillmentStatus as orderFulfillmentStatus
         FROM Shipment s
         LEFT JOIN "Order" o ON s.orderId = o.id
         WHERE s.id = ?`,
        shipmentId
      ) as Record<string, unknown>[];

      let shipment: Record<string, unknown>;
      if (shipmentRows && shipmentRows.length > 0) {
        const row = shipmentRows[0];
        const {
          orderId: oId, orderNumber, customerName, customerEmail,
          orderTotal, orderStatus, orderFulfillmentStatus,
          ...shipmentData
        } = row;

        shipment = {
          ...shipmentData,
          order: {
            id: oId,
            orderNumber,
            customerName,
            customerEmail,
            total: orderTotal,
            status: orderStatus,
            fulfillmentStatus: orderFulfillmentStatus,
          },
        };
      } else {
        shipment = {
          id: shipmentId,
          orderId,
          storeId,
          trackingNumber: generatedTracking,
          carrier: carrier || null,
          shippingMethod: shippingMethod || null,
          status: 'label_created',
          weight: weight ? Number(weight) : null,
          dimensions: dimensionsStr,
          notes: notes || null,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            total: order.total,
            status: 'processing',
            fulfillmentStatus: 'partial',
          },
        };
      }

      return NextResponse.json({ shipment }, { status: 201 });
    }
  } catch (error) {
    console.error('Create shipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
