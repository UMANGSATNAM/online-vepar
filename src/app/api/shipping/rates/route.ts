import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { zoneId, name, priceType, minWeight, maxWeight, minOrderValue, maxOrderValue, rate, freeAbove, estimatedDays, isActive } = body;

    if (!zoneId || !name || !priceType || rate === undefined) {
      return NextResponse.json(
        { error: 'zoneId, name, priceType, and rate are required' },
        { status: 400 }
      );
    }

    // Verify user owns the zone's store
    const zone = await db.shippingZone.findUnique({
      where: { id: zoneId },
      include: { store: { select: { ownerId: true } } },
    });

    if (!zone) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    if (zone.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const shippingRate = await db.shippingRate.create({
      data: {
        zoneId,
        name,
        priceType,
        minWeight: minWeight ? Number(minWeight) : null,
        maxWeight: maxWeight ? Number(maxWeight) : null,
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        maxOrderValue: maxOrderValue ? Number(maxOrderValue) : null,
        rate: Number(rate),
        freeAbove: freeAbove ? Number(freeAbove) : null,
        estimatedDays: estimatedDays || '3-5',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ rate: shippingRate }, { status: 201 });
  } catch (error) {
    console.error('Create shipping rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
