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

    const discount = await db.discount.findFirst({
      where: {
        storeId,
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!discount) {
      return NextResponse.json({ valid: false, error: 'Invalid discount code' }, { status: 200 });
    }

    // Check dates
    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) {
      return NextResponse.json({ valid: false, error: 'Discount code is not yet active' }, { status: 200 });
    }
    if (discount.endsAt && now > discount.endsAt) {
      return NextResponse.json({ valid: false, error: 'Discount code has expired' }, { status: 200 });
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Discount code has reached its usage limit' }, { status: 200 });
    }

    // Check minimum order amount
    if (discount.minOrderAmount && subtotal !== undefined && subtotal < discount.minOrderAmount) {
      return NextResponse.json(
        { valid: false, error: `Minimum order amount of ₹${discount.minOrderAmount} required` },
        { status: 200 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (subtotal !== undefined) {
      if (discount.type === 'percentage') {
        discountAmount = subtotal * (discount.value / 100);
        if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
          discountAmount = discount.maxDiscount;
        }
      } else {
        discountAmount = Math.min(discount.value, subtotal);
      }
    }

    return NextResponse.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount,
        minOrderAmount: discount.minOrderAmount,
        maxDiscount: discount.maxDiscount,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Validate discount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
