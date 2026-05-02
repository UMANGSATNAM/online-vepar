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
      const zones = await db.shippingZone.findMany({
        where: { storeId },
        include: { rates: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ zones }, { status: 200 });
    } catch (modelError) {
      // Fallback to raw SQL if ShippingZone model is not available
      console.warn('ShippingZone model not available, using raw SQL fallback:', modelError);

      const zonesRaw = await db.$queryRawUnsafe(
        `SELECT * FROM ShippingZone WHERE storeId = ? ORDER BY createdAt DESC`,
        storeId
      ) as Record<string, unknown>[];

      // Get rates for each zone
      const zones = await Promise.all(
        zonesRaw.map(async (zone) => {
          const rates = await db.$queryRawUnsafe(
            `SELECT * FROM ShippingRate WHERE zoneId = ? ORDER BY createdAt ASC`,
            zone.id
          ) as Record<string, unknown>[];
          return { ...zone, rates };
        })
      );

      return NextResponse.json({ zones }, { status: 200 });
    }
  } catch (error) {
    console.error('Get shipping zones error:', error);
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
    const { storeId, name, regions, isActive, rates } = body;

    if (!storeId || !name || !regions) {
      return NextResponse.json(
        { error: 'storeId, name, and regions are required' },
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

    const regionsStr = typeof regions === 'string' ? regions : JSON.stringify(regions);

    try {
      const zone = await db.shippingZone.create({
        data: {
          storeId,
          name,
          regions: regionsStr,
          isActive: isActive !== undefined ? isActive : true,
          rates: rates && rates.length > 0
            ? {
                create: rates.map((r: Record<string, unknown>) => ({
                  name: r.name as string,
                  priceType: (r.priceType as string) || 'flat',
                  minWeight: r.minWeight ? Number(r.minWeight) : null,
                  maxWeight: r.maxWeight ? Number(r.maxWeight) : null,
                  minOrderValue: r.minOrderValue ? Number(r.minOrderValue) : null,
                  maxOrderValue: r.maxOrderValue ? Number(r.maxOrderValue) : null,
                  rate: Number(r.rate) || 0,
                  freeAbove: r.freeAbove ? Number(r.freeAbove) : null,
                  estimatedDays: (r.estimatedDays as string) || '3-5',
                  isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
                })),
              }
            : undefined,
        },
        include: { rates: true },
      });

      return NextResponse.json({ zone }, { status: 201 });
    } catch (modelError) {
      // Fallback to raw SQL if ShippingZone model is not available
      console.warn('ShippingZone model not available, using raw SQL fallback:', modelError);

      const zoneId = generateCuid();
      const isActiveVal = isActive !== undefined ? (isActive ? 1 : 0) : 1;

      await db.$executeRawUnsafe(
        `INSERT INTO ShippingZone (id, name, regions, storeId, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        zoneId, name, regionsStr, storeId, isActiveVal
      );

      // Insert rates if provided
      const createdRates: Record<string, unknown>[] = [];
      if (rates && Array.isArray(rates) && rates.length > 0) {
        for (const r of rates) {
          const rateId = generateCuid();
          const rateIsActive = r.isActive !== undefined ? (r.isActive ? 1 : 0) : 1;
          await db.$executeRawUnsafe(
            `INSERT INTO ShippingRate (id, name, zoneId, priceType, minWeight, maxWeight, minOrderValue, maxOrderValue, rate, freeAbove, estimatedDays, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            rateId,
            r.name as string,
            zoneId,
            (r.priceType as string) || 'flat',
            r.minWeight ? Number(r.minWeight) : null,
            r.maxWeight ? Number(r.maxWeight) : null,
            r.minOrderValue ? Number(r.minOrderValue) : null,
            r.maxOrderValue ? Number(r.maxOrderValue) : null,
            Number(r.rate) || 0,
            r.freeAbove ? Number(r.freeAbove) : null,
            (r.estimatedDays as string) || '3-5',
            rateIsActive
          );
          createdRates.push({
            id: rateId,
            name: r.name,
            zoneId,
            priceType: (r.priceType as string) || 'flat',
            minWeight: r.minWeight ? Number(r.minWeight) : null,
            maxWeight: r.maxWeight ? Number(r.maxWeight) : null,
            minOrderValue: r.minOrderValue ? Number(r.minOrderValue) : null,
            maxOrderValue: r.maxOrderValue ? Number(r.maxOrderValue) : null,
            rate: Number(r.rate) || 0,
            freeAbove: r.freeAbove ? Number(r.freeAbove) : null,
            estimatedDays: (r.estimatedDays as string) || '3-5',
            isActive: rateIsActive === 1,
          });
        }
      }

      // Fetch the created zone
      const zoneRows = await db.$queryRawUnsafe(
        `SELECT * FROM ShippingZone WHERE id = ?`,
        zoneId
      ) as Record<string, unknown>[];

      const zone = {
        ...(zoneRows?.[0] || { id: zoneId, name, regions: regionsStr, storeId, isActive: isActiveVal === 1 }),
        rates: createdRates,
      };

      return NextResponse.json({ zone }, { status: 201 });
    }
  } catch (error) {
    console.error('Create shipping zone error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
