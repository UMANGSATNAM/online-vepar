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
    const entity = searchParams.get('entity') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dateRange = searchParams.get('dateRange') || '';

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

    // Build date filter
    const now = new Date();
    let dateFilter: Date | undefined;
    if (dateRange === 'today') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === '7d') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '30d') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const where: Record<string, unknown> = { storeId };

    if (entity) {
      where.entity = entity;
    }

    if (search) {
      where.OR = [
        { entityName: { contains: search } },
        { userName: { contains: search } },
        { action: { contains: search } },
      ];
    }

    if (dateFilter) {
      where.createdAt = { gte: dateFilter };
    }

    // Fetch activity logs
    let logs;
    let total;
    try {
      total = await db.activityLog.count({ where });
      logs = await db.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch {
      // Fallback to raw SQL
      let whereClause = 'WHERE storeId = ?';
      const params: unknown[] = [storeId];

      if (entity) {
        whereClause += ' AND entity = ?';
        params.push(entity);
      }
      if (search) {
        whereClause += ' AND (entityName LIKE ? OR userName LIKE ? OR action LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (dateFilter) {
        whereClause += ' AND createdAt >= ?';
        params.push(dateFilter.toISOString());
      }

      const countResult = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM ActivityLog ${whereClause}`,
        ...params
      ) as Array<{ count: number }>;
      total = countResult?.[0]?.count || 0;

      logs = await db.$queryRawUnsafe(
        `SELECT * FROM ActivityLog ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        ...params,
        limit,
        (page - 1) * limit
      ) as Array<Record<string, unknown>>;
    }

    // Get summary counts (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let summary;
    try {
      const totalActivities7d = await db.activityLog.count({
        where: { storeId, createdAt: { gte: sevenDaysAgo } },
      });
      const productActivities7d = await db.activityLog.count({
        where: { storeId, entity: 'product', createdAt: { gte: sevenDaysAgo } },
      });
      const orderActivities7d = await db.activityLog.count({
        where: { storeId, entity: 'order', createdAt: { gte: sevenDaysAgo } },
      });
      const customerActivities7d = await db.activityLog.count({
        where: { storeId, entity: 'customer', createdAt: { gte: sevenDaysAgo } },
      });
      summary = { total: totalActivities7d, products: productActivities7d, orders: orderActivities7d, customers: customerActivities7d };
    } catch {
      // Fallback raw SQL for summary
      try {
        const summaryResult = await db.$queryRawUnsafe(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN entity = 'product' THEN 1 ELSE 0 END) as products,
            SUM(CASE WHEN entity = 'order' THEN 1 ELSE 0 END) as orders,
            SUM(CASE WHEN entity = 'customer' THEN 1 ELSE 0 END) as customers
          FROM ActivityLog WHERE storeId = ? AND createdAt >= ?`,
          storeId,
          sevenDaysAgo.toISOString()
        ) as Array<Record<string, number>>;
        const row = summaryResult?.[0] || {};
        summary = { total: row.total || 0, products: row.products || 0, orders: row.orders || 0, customers: row.customers || 0 };
      } catch {
        summary = { total: 0, products: 0, orders: 0, customers: 0 };
      }
    }

    // Get action type counts
    let actionCounts;
    try {
      actionCounts = await db.activityLog.groupBy({
        by: ['action'],
        where: { storeId, createdAt: { gte: sevenDaysAgo } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      });
    } catch {
      try {
        const actionResult = await db.$queryRawUnsafe(
          `SELECT action, COUNT(*) as count FROM ActivityLog WHERE storeId = ? AND createdAt >= ? GROUP BY action ORDER BY count DESC LIMIT 10`,
          storeId,
          sevenDaysAgo.toISOString()
        ) as Array<{ action: string; count: number }>;
        actionCounts = actionResult.map(r => ({ action: r.action, _count: { action: r.count } }));
      } catch {
        actionCounts = [];
      }
    }

    return NextResponse.json({
      logs,
      summary,
      actionCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
