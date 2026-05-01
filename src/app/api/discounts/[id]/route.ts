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

    const discount = await db.discount.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    if (discount.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { store: _store, ...discountData } = discount;
    return NextResponse.json({ discount: discountData }, { status: 200 });
  } catch (error) {
    console.error('Get discount error:', error);
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

    const existing = await db.discount.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    if (existing.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code, name, description, type, value,
      minOrderAmount, maxDiscount, usageLimit, perCustomerLimit,
      appliesTo, applicableIds, startsAt, endsAt, isActive,
    } = body;

    // If code is being changed, check for duplicates
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await db.discount.findFirst({
        where: { storeId: existing.storeId, code: code.toUpperCase(), id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A discount with this code already exists for this store' },
          { status: 409 }
        );
      }
    }

    if (type && type !== 'percentage' && type !== 'fixed_amount') {
      return NextResponse.json(
        { error: 'type must be "percentage" or "fixed_amount"' },
        { status: 400 }
      );
    }

    if (value !== undefined && value <= 0) {
      return NextResponse.json(
        { error: 'value must be a positive number' },
        { status: 400 }
      );
    }

    const discountType = type || existing.type;
    const discountValue = value !== undefined ? parseFloat(String(value)) : existing.value;
    if (discountType === 'percentage' && discountValue > 100) {
      return NextResponse.json(
        { error: 'percentage value cannot exceed 100' },
        { status: 400 }
      );
    }

    const discount = await db.discount.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value: parseFloat(String(value)) }),
        ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount ? parseFloat(String(minOrderAmount)) : null }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(String(maxDiscount)) : null }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(String(usageLimit)) : null }),
        ...(perCustomerLimit !== undefined && { perCustomerLimit: perCustomerLimit ? parseInt(String(perCustomerLimit)) : null }),
        ...(appliesTo !== undefined && { appliesTo }),
        ...(applicableIds !== undefined && { applicableIds }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ discount }, { status: 200 });
  } catch (error) {
    console.error('Update discount error:', error);
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

    const existing = await db.discount.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    if (existing.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.discount.delete({ where: { id } });

    return NextResponse.json({ message: 'Discount deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete discount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
