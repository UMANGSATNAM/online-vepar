import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

function generateRecoveryToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'rc_';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status') || '';
    const dateRange = searchParams.get('dateRange') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Build where clause
    const where: Record<string, unknown> = { storeId };

    if (status) {
      where.status = status;
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      where.abandonedAt = { gte: startDate };
    }

    // Search filter
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    let carts;
    let totalCount = 0;

    try {
      // Get total count
      totalCount = await db.abandonedCart.count({ where });

      // Get paginated carts
      carts = await db.abandonedCart.findMany({
        where,
        orderBy: { abandonedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch {
      // Fallback to raw SQL if Prisma model is not available
      let whereClause = 'WHERE ac.storeId = ?';
      const params: unknown[] = [storeId];

      if (status) {
        whereClause += ' AND ac.status = ?';
        params.push(status);
      }

      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        whereClause += ' AND ac.abandonedAt >= ?';
        params.push(startDate.toISOString());
      }

      if (search) {
        whereClause += ' AND (ac.customerName LIKE ? OR ac.customerEmail LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const countResult = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM AbandonedCart ac ${whereClause}`,
        ...params
      ) as Record<string, unknown>[];
      totalCount = Number(countResult?.[0]?.count || 0);

      carts = await db.$queryRawUnsafe(
        `SELECT ac.* FROM AbandonedCart ac ${whereClause} ORDER BY ac.abandonedAt DESC LIMIT ? OFFSET ?`,
        ...params, limit, (page - 1) * limit
      );
    }

    // Compute summary stats
    let stats;
    try {
      const [totalAbandoned, totalValue, recoveredCount, totalEmailsSent] = await Promise.all([
        db.abandonedCart.count({ where: { storeId } }),
        db.abandonedCart.aggregate({ where: { storeId }, _sum: { total: true } }),
        db.abandonedCart.count({ where: { storeId, status: 'recovered' } }),
        db.abandonedCart.aggregate({ where: { storeId, status: { in: ['email_sent', 'recovered'] } }, _sum: { reminderCount: true } }),
      ]);

      stats = {
        totalAbandoned,
        totalValue: totalValue._sum.total || 0,
        recoveryRate: totalAbandoned > 0 ? Math.round((recoveredCount / totalAbandoned) * 100) : 0,
        emailsSent: totalEmailsSent._sum.reminderCount || 0,
      };
    } catch {
      // Fallback: compute stats from raw queries
      try {
        const [totalResult, valueResult, recoveredResult, emailsResult] = await Promise.all([
          db.$queryRawUnsafe('SELECT COUNT(*) as count FROM AbandonedCart WHERE storeId = ?', storeId) as Promise<Record<string, unknown>[]>,
          db.$queryRawUnsafe('SELECT SUM(total) as totalValue FROM AbandonedCart WHERE storeId = ?', storeId) as Promise<Record<string, unknown>[]>,
          db.$queryRawUnsafe('SELECT COUNT(*) as count FROM AbandonedCart WHERE storeId = ? AND status = ?', storeId, 'recovered') as Promise<Record<string, unknown>[]>,
          db.$queryRawUnsafe('SELECT SUM(reminderCount) as totalReminders FROM AbandonedCart WHERE storeId = ? AND status IN (?, ?)', storeId, 'email_sent', 'recovered') as Promise<Record<string, unknown>[]>,
        ]);

        const totalAbandoned = Number(totalResult?.[0]?.count || 0);
        const recoveredCount = Number(recoveredResult?.[0]?.count || 0);

        stats = {
          totalAbandoned,
          totalValue: Number(valueResult?.[0]?.totalValue || 0),
          recoveryRate: totalAbandoned > 0 ? Math.round((recoveredCount / totalAbandoned) * 100) : 0,
          emailsSent: Number(emailsResult?.[0]?.totalReminders || 0),
        };
      } catch {
        stats = {
          totalAbandoned: 0,
          totalValue: 0,
          recoveryRate: 0,
          emailsSent: 0,
        };
      }
    }

    return NextResponse.json({
      carts,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get abandoned carts error:', error);
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
      storeId, customerEmail, customerName, customerPhone,
      items, subtotal, tax, shipping, total, currency,
    } = body;

    if (!storeId || !customerEmail) {
      return NextResponse.json(
        { error: 'storeId and customerEmail are required' },
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

    const recoveryToken = generateRecoveryToken();
    const recoveryUrl = `https://${store.slug}.onlinevepar.com/cart/recover?token=${recoveryToken}`;

    let cart;
    try {
      cart = await db.abandonedCart.create({
        data: {
          storeId,
          customerEmail,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          items: items ? JSON.stringify(items) : '[]',
          subtotal: subtotal || 0,
          tax: tax || 0,
          shipping: shipping || 0,
          total: total || 0,
          currency: currency || 'INR',
          recoveryToken,
          recoveryUrl,
          status: 'abandoned',
          abandonedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    } catch {
      // Fallback to raw SQL
      await db.$executeRawUnsafe(
        `INSERT INTO AbandonedCart (id, storeId, customerEmail, customerName, customerPhone, items, subtotal, tax, shipping, total, currency, recoveryToken, recoveryUrl, status, abandonedAt, expiresAt, reminderCount, createdAt, updatedAt)
         VALUES (lower(hex(randomblob(8)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+30 days'), 0, datetime('now'), datetime('now'))`,
        storeId, customerEmail, customerName || null, customerPhone || null,
        items ? JSON.stringify(items) : '[]',
        subtotal || 0, tax || 0, shipping || 0, total || 0,
        currency || 'INR', recoveryToken, recoveryUrl, 'abandoned'
      );
      cart = { customerEmail, recoveryToken, status: 'abandoned' };
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'abandoned_cart.created',
      entity: 'abandoned_cart',
      entityId: (cart as Record<string, unknown>).id as string | undefined,
      entityName: customerEmail,
      details: { total: total || 0, itemCount: items?.length || 0 },
    });

    return NextResponse.json({ cart }, { status: 201 });
  } catch (error) {
    console.error('Create abandoned cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
