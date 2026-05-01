import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

    const existing = await db.shippingRate.findUnique({
      where: { id },
      include: { zone: { include: { store: { select: { ownerId: true } } } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shipping rate not found' }, { status: 404 });
    }

    if (existing.zone.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, priceType, minWeight, maxWeight, minOrderValue, maxOrderValue, rate, freeAbove, estimatedDays, isActive } = body;

    const shippingRate = await db.shippingRate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(priceType !== undefined && { priceType }),
        ...(minWeight !== undefined && { minWeight: minWeight ? Number(minWeight) : null }),
        ...(maxWeight !== undefined && { maxWeight: maxWeight ? Number(maxWeight) : null }),
        ...(minOrderValue !== undefined && { minOrderValue: minOrderValue ? Number(minOrderValue) : null }),
        ...(maxOrderValue !== undefined && { maxOrderValue: maxOrderValue ? Number(maxOrderValue) : null }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(freeAbove !== undefined && { freeAbove: freeAbove ? Number(freeAbove) : null }),
        ...(estimatedDays !== undefined && { estimatedDays }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ rate: shippingRate }, { status: 200 });
  } catch (error) {
    console.error('Update shipping rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.shippingRate.findUnique({
      where: { id },
      include: { zone: { include: { store: { select: { ownerId: true } } } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shipping rate not found' }, { status: 404 });
    }

    if (existing.zone.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.shippingRate.delete({ where: { id } });

    return NextResponse.json({ message: 'Shipping rate deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete shipping rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
