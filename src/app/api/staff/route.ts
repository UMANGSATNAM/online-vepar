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
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

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
        { email: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    let staff;
    try {
      staff = await db.staff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback raw query if Prisma Client is stale
      let whereClause = 'WHERE storeId = ?';
      const params: unknown[] = [storeId];
      if (search) {
        whereClause += ' AND (name LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      staff = await db.$queryRawUnsafe(
        `SELECT * FROM Staff ${whereClause} ORDER BY createdAt DESC`,
        ...params
      );
    }

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error) {
    console.error('Get staff error:', error);
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
    const { storeId, email, name, role, permissions } = body;

    if (!storeId || !email || !name) {
      return NextResponse.json(
        { error: 'storeId, email, and name are required' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'manager', 'staff', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: admin, manager, staff, or viewer' },
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

    // Check for duplicate email within store
    let existing;
    try {
      existing = await db.staff.findFirst({
        where: { storeId, email },
      });
    } catch {
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Staff WHERE storeId = ? AND email = ? LIMIT 1',
        storeId, email
      );
      existing = Array.isArray(results) && results.length > 0 ? results[0] : null;
    }

    if (existing) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists for this store' },
        { status: 409 }
      );
    }

    const defaultPermissions = {
      products: true,
      orders: true,
      customers: true,
      analytics: true,
      discounts: false,
      settings: false,
      reviews: true,
      inventory: true,
      shipping: false,
      taxRates: false,
      abandonedCarts: false,
      pages: false,
      collections: true,
    };

    // Role-based default permissions
    const roleDefaults: Record<string, Record<string, boolean>> = {
      admin: {
        products: true, orders: true, customers: true, analytics: true,
        discounts: true, settings: true, reviews: true, inventory: true,
        shipping: true, taxRates: true, abandonedCarts: true, pages: true, collections: true,
      },
      manager: {
        products: true, orders: true, customers: true, analytics: true,
        discounts: true, settings: false, reviews: true, inventory: true,
        shipping: true, taxRates: false, abandonedCarts: true, pages: true, collections: true,
      },
      staff: {
        products: true, orders: true, customers: true, analytics: true,
        discounts: false, settings: false, reviews: true, inventory: true,
        shipping: false, taxRates: false, abandonedCarts: false, pages: false, collections: true,
      },
      viewer: {
        products: true, orders: true, customers: true, analytics: true,
        discounts: false, settings: false, reviews: true, inventory: false,
        shipping: false, taxRates: false, abandonedCarts: false, pages: false, collections: false,
      },
    };

    const finalPermissions = permissions || roleDefaults[role || 'staff'] || defaultPermissions;

    let staff;
    try {
      staff = await db.staff.create({
        data: {
          storeId,
          email,
          name,
          role: role || 'staff',
          status: 'invited',
          permissions: JSON.stringify(finalPermissions),
        },
      });
    } catch {
      // Fallback raw SQL
      const permStr = JSON.stringify(finalPermissions);
      await db.$executeRawUnsafe(
        `INSERT INTO Staff (id, email, name, role, status, avatar, permissions, storeId, invitedAt, acceptedAt, lastActiveAt, createdAt, updatedAt) VALUES (lower(hex(randomblob(8)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(8))), ?, ?, ?, 'invited', NULL, ?, ?, datetime('now'), NULL, NULL, datetime('now'), datetime('now'))`,
        email, name, role || 'staff', permStr, storeId
      );
      staff = { email, name, role: role || 'staff', status: 'invited' };
    }

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
