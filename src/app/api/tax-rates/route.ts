import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'priority';
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
        { name: { contains: search } },
        { country: { contains: search } },
        { state: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    let taxRates;
    try {
      taxRates = await db.taxRate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
      });
    } catch {
      // Prisma Client may be stale after schema changes, use raw query
      let whereClause = 'WHERE storeId = ?';
      const params: unknown[] = [storeId];
      if (search) {
        whereClause += ' AND (name LIKE ? OR country LIKE ? OR state LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (isActive !== null && isActive !== '') {
        whereClause += ' AND isActive = ?';
        params.push(isActive === 'true' ? 1 : 0);
      }
      const validSortColumns = ['createdAt', 'updatedAt', 'name', 'rate', 'priority'];
      const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'priority';
      const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      taxRates = await db.$queryRawUnsafe(
        `SELECT * FROM TaxRate ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder}`,
        ...params
      );
    }

    return NextResponse.json({ taxRates }, { status: 200 });
  } catch (error) {
    console.error('Get tax rates error:', error);
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
      storeId, name, rate, country, state, city, zipCode,
      isCompound, priority, isActive,
    } = body;

    if (!storeId || !name || rate === undefined) {
      return NextResponse.json(
        { error: 'storeId, name, and rate are required' },
        { status: 400 }
      );
    }

    if (rate <= 0) {
      return NextResponse.json(
        { error: 'Rate must be a positive number' },
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

    // Check for duplicate name within store
    let existing;
    try {
      existing = await db.taxRate.findFirst({
        where: { storeId, name },
      });
    } catch {
      existing = await db.$queryRawUnsafe(
        'SELECT * FROM TaxRate WHERE storeId = ? AND name = ? LIMIT 1',
        storeId, name
      );
      existing = Array.isArray(existing) && existing.length > 0 ? existing[0] : null;
    }

    if (existing) {
      return NextResponse.json(
        { error: 'A tax rate with this name already exists for this store' },
        { status: 409 }
      );
    }

    let taxRate;
    try {
      taxRate = await db.taxRate.create({
        data: {
          storeId,
          name,
          rate: parseFloat(String(rate)),
          country: country || null,
          state: state || null,
          city: city || null,
          zipCode: zipCode || null,
          isCompound: isCompound || false,
          priority: priority || 0,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } catch {
      // Fallback to raw SQL
      await db.$executeRawUnsafe(
        `INSERT INTO TaxRate (id, name, rate, country, state, city, zipCode, isCompound, priority, isActive, storeId, createdAt, updatedAt) VALUES (lower(hex(randomblob(8)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        name, parseFloat(String(rate)), country || null, state || null, city || null,
        zipCode || null, isCompound ? 1 : 0, priority || 0,
        isActive !== undefined ? (isActive ? 1 : 0) : 1, storeId
      );
      taxRate = { name, rate, storeId, isActive: true };
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'tax_rate.created',
      entity: 'tax_rate',
      entityId: (taxRate as Record<string, unknown>).id as string | undefined,
      entityName: name,
      details: { rate, country, isActive: isActive !== undefined ? isActive : true },
    });

    return NextResponse.json({ taxRate }, { status: 201 });
  } catch (error) {
    console.error('Create tax rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
