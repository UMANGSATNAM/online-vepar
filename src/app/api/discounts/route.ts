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
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
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
        { code: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const discounts = await db.discount.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json({ discounts }, { status: 200 });
  } catch (error) {
    console.error('Get discounts error:', error);
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
      storeId, code, name, description, type, value,
      minOrderAmount, maxDiscount, usageLimit, perCustomerLimit,
      appliesTo, applicableIds, startsAt, endsAt, isActive,
    } = body;

    if (!storeId || !code || !name || !type || value === undefined) {
      return NextResponse.json(
        { error: 'storeId, code, name, type, and value are required' },
        { status: 400 }
      );
    }

    if (type !== 'percentage' && type !== 'fixed_amount') {
      return NextResponse.json(
        { error: 'type must be "percentage" or "fixed_amount"' },
        { status: 400 }
      );
    }

    if (value <= 0) {
      return NextResponse.json(
        { error: 'value must be a positive number' },
        { status: 400 }
      );
    }

    if (type === 'percentage' && value > 100) {
      return NextResponse.json(
        { error: 'percentage value cannot exceed 100' },
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

    // Check for duplicate code within store
    const existing = await db.discount.findFirst({
      where: { storeId, code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A discount with this code already exists for this store' },
        { status: 409 }
      );
    }

    const discount = await db.discount.create({
      data: {
        storeId,
        code: code.toUpperCase(),
        name,
        description: description || null,
        type,
        value: parseFloat(String(value)),
        minOrderAmount: minOrderAmount ? parseFloat(String(minOrderAmount)) : null,
        maxDiscount: maxDiscount ? parseFloat(String(maxDiscount)) : null,
        usageLimit: usageLimit ? parseInt(String(usageLimit)) : null,
        perCustomerLimit: perCustomerLimit ? parseInt(String(perCustomerLimit)) : null,
        appliesTo: appliesTo || 'all',
        applicableIds: applicableIds || '[]',
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error('Create discount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
