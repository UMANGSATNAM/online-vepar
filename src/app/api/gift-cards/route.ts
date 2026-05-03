import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GC-${segment()}-${segment()}`;
}

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

    const where: Record<string, unknown> = { storeId };

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { recipientName: { contains: search } },
        { recipientEmail: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    let giftCards;
    let total;
    try {
      [giftCards, total] = await Promise.all([
        db.giftCard.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.giftCard.count({ where }),
      ]);
    } catch {
      // Fallback to raw SQL if Prisma Client is stale
      let whereClause = 'WHERE storeId = ?';
      const params: unknown[] = [storeId];
      if (search) {
        whereClause += ' AND (code LIKE ? OR name LIKE ? OR recipientName LIKE ? OR recipientEmail LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      giftCards = await db.$queryRawUnsafe(
        `SELECT * FROM GiftCard ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        ...params, limit, (page - 1) * limit
      ) as Record<string, unknown>[];
      const countResult = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM GiftCard ${whereClause}`,
        ...params
      ) as Record<string, unknown>[];
      total = Number(countResult?.[0]?.count ?? 0);
    }

    return NextResponse.json({
      giftCards,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (error) {
    console.error('Get gift cards error:', error);
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
      storeId, code, name, description, initialBalance, currency,
      recipientName, recipientEmail, senderName, message, purchasedBy,
      template, expiresAt,
    } = body;

    if (!storeId || !name || initialBalance === undefined) {
      return NextResponse.json(
        { error: 'storeId, name, and initialBalance are required' },
        { status: 400 }
      );
    }

    if (initialBalance <= 0) {
      return NextResponse.json(
        { error: 'initialBalance must be a positive number' },
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

    const giftCardCode = code || generateGiftCardCode();

    // Check for duplicate code within store
    let existing;
    try {
      existing = await db.giftCard.findFirst({
        where: { storeId, code: giftCardCode },
      });
    } catch {
      const rows = await db.$queryRawUnsafe(
        'SELECT * FROM GiftCard WHERE storeId = ? AND code = ? LIMIT 1',
        storeId, giftCardCode
      ) as Record<string, unknown>[];
      existing = rows && rows.length > 0 ? rows[0] : null;
    }

    if (existing) {
      return NextResponse.json(
        { error: 'A gift card with this code already exists for this store' },
        { status: 409 }
      );
    }

    const validTemplates = ['classic', 'birthday', 'festive', 'minimal'];
    if (template && !validTemplates.includes(template)) {
      return NextResponse.json(
        { error: 'template must be one of: classic, birthday, festive, minimal' },
        { status: 400 }
      );
    }

    let giftCard;
    try {
      giftCard = await db.giftCard.create({
        data: {
          storeId,
          code: giftCardCode,
          name,
          description: description || null,
          initialBalance: parseFloat(String(initialBalance)),
          currentBalance: parseFloat(String(initialBalance)),
          currency: currency || 'INR',
          status: 'active',
          recipientName: recipientName || null,
          recipientEmail: recipientEmail || null,
          senderName: senderName || null,
          message: message || null,
          purchasedBy: purchasedBy || null,
          template: template || 'classic',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    } catch {
      // Fallback to raw SQL
      await db.$executeRawUnsafe(
        `INSERT INTO GiftCard (id, code, name, description, initialBalance, currentBalance, currency, status, recipientName, recipientEmail, senderName, message, purchasedBy, template, expiresAt, redeemedAt, storeId, createdAt, updatedAt) VALUES (lower(hex(randomblob(8)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, datetime('now'), datetime('now'))`,
        giftCardCode, name, description || null,
        parseFloat(String(initialBalance)), parseFloat(String(initialBalance)),
        currency || 'INR', 'active',
        recipientName || null, recipientEmail || null,
        senderName || null, message || null, purchasedBy || null,
        template || 'classic',
        expiresAt ? new Date(expiresAt).toISOString() : null,
        storeId
      );
      giftCard = { code: giftCardCode, name, initialBalance, currentBalance: initialBalance, storeId };
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'giftcard.created',
      entity: 'giftcard',
      entityId: (giftCard as Record<string, unknown>).id as string | undefined,
      entityName: `${giftCardCode} - ${name}`,
      details: { initialBalance, template: template || 'classic' },
    });

    return NextResponse.json({ giftCard }, { status: 201 });
  } catch (error) {
    console.error('Create gift card error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
