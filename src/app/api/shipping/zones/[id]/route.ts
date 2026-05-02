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

    const zone = await db.shippingZone.findUnique({
      where: { id },
      include: { rates: { orderBy: { createdAt: 'asc' } }, store: { select: { ownerId: true } } },
    });

    if (!zone) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    if (zone.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { store: _store, ...zoneData } = zone;
    return NextResponse.json({ zone: zoneData }, { status: 200 });
  } catch (error) {
    console.error('Get shipping zone error:', error);
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

    const existing = await db.shippingZone.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    if (existing.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, regions, isActive } = body;

    const zone = await db.shippingZone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(regions !== undefined && { regions: typeof regions === 'string' ? regions : JSON.stringify(regions) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { rates: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({ zone }, { status: 200 });
  } catch (error) {
    console.error('Update shipping zone error:', error);
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

    const existing = await db.shippingZone.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    if (existing.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.shippingZone.delete({ where: { id } });

    return NextResponse.json({ message: 'Shipping zone deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete shipping zone error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
