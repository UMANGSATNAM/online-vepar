import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, storeId } = body;

    if (!code || !storeId) {
      return NextResponse.json(
        { error: 'code and storeId are required' },
        { status: 400 }
      );
    }

    let giftCard;
    try {
      giftCard = await db.giftCard.findFirst({
        where: { code, storeId },
      });
    } catch {
      const rows = await db.$queryRawUnsafe(
        'SELECT * FROM GiftCard WHERE code = ? AND storeId = ? LIMIT 1',
        code, storeId
      ) as Record<string, unknown>[];
      giftCard = rows && rows.length > 0 ? rows[0] : null;
    }

    if (!giftCard) {
      return NextResponse.json(
        { valid: false, error: 'Gift card not found' },
        { status: 200 }
      );
    }

    const gc = giftCard as Record<string, unknown>;

    // Check status
    if (gc.status === 'redeemed') {
      return NextResponse.json(
        { valid: false, error: 'Gift card has been fully redeemed', status: gc.status },
        { status: 200 }
      );
    }

    if (gc.status === 'expired') {
      return NextResponse.json(
        { valid: false, error: 'Gift card has expired', status: gc.status },
        { status: 200 }
      );
    }

    if (gc.status === 'disabled') {
      return NextResponse.json(
        { valid: false, error: 'Gift card has been disabled', status: gc.status },
        { status: 200 }
      );
    }

    // Check expiry
    if (gc.expiresAt && new Date(String(gc.expiresAt)) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Gift card has expired', status: 'expired' },
        { status: 200 }
      );
    }

    // Check balance
    if (Number(gc.currentBalance) <= 0) {
      return NextResponse.json(
        { valid: false, error: 'Gift card has no remaining balance', status: 'redeemed' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: gc.id,
        code: gc.code,
        name: gc.name,
        currentBalance: gc.currentBalance,
        currency: gc.currency,
        template: gc.template,
        expiresAt: gc.expiresAt,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Validate gift card error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
