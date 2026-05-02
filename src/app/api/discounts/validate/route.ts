import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, storeId, subtotal } = body as {
      code: string;
      storeId: string;
      subtotal?: number;
    };

    if (!code || !storeId) {
      return NextResponse.json({ error: 'code and storeId are required' }, { status: 400 });
    }

    let discount: Record<string, unknown> | null = null;

    try {
      discount = await db.discount.findFirst({
        where: {
          storeId,
          code: code.toUpperCase(),
          isActive: true,
        },
      }) as Record<string, unknown> | null;
    } catch (modelError) {
      // Fallback to raw SQL if Discount model is not available
      console.warn('Discount model not available, using raw SQL fallback:', modelError);

      const rows = await db.$queryRawUnsafe(
        `SELECT * FROM Discount WHERE storeId = ? AND code = ? AND isActive = 1 LIMIT 1`,
        storeId, code.toUpperCase()
      ) as Record<string, unknown>[];

      discount = rows && rows.length > 0 ? rows[0] : null;
    }

    if (!discount) {
      return NextResponse.json({ valid: false, error: 'Invalid discount code' }, { status: 200 });
    }

    // Check dates
    const now = new Date();
    const startsAt = discount.startsAt ? new Date(discount.startsAt as string | Date) : null;
    const endsAt = discount.endsAt ? new Date(discount.endsAt as string | Date) : null;

    if (startsAt && now < startsAt) {
      return NextResponse.json({ valid: false, error: 'Discount code is not yet active' }, { status: 200 });
    }
    if (endsAt && now > endsAt) {
      return NextResponse.json({ valid: false, error: 'Discount code has expired' }, { status: 200 });
    }

    // Check usage limit
    const usageLimit = discount.usageLimit as number | null;
    const usedCount = discount.usedCount as number;
    if (usageLimit && usedCount >= usageLimit) {
      return NextResponse.json({ valid: false, error: 'Discount code has reached its usage limit' }, { status: 200 });
    }

    // Check minimum order amount
    const minOrderAmount = discount.minOrderAmount as number | null;
    if (minOrderAmount && subtotal !== undefined && subtotal < minOrderAmount) {
      return NextResponse.json(
        { valid: false, error: `Minimum order amount of ₹${minOrderAmount} required` },
        { status: 200 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountValue = discount.value as number;
    const discountType = discount.type as string;
    const maxDiscount = discount.maxDiscount as number | null;

    if (subtotal !== undefined) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
        if (maxDiscount && discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      } else {
        discountAmount = Math.min(discountValue, subtotal);
      }
    }

    return NextResponse.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discountType,
        value: discountValue,
        discountAmount,
        minOrderAmount,
        maxDiscount,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Validate discount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
