import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

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

    try {
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
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('Discount model not available, using raw SQL fallback:', modelError);

      const rows = await db.$queryRawUnsafe(
        `SELECT d.*, s.ownerId FROM Discount d LEFT JOIN Store s ON d.storeId = s.id WHERE d.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      }

      const row = rows[0];
      if (row.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { ownerId, ...discountData } = row;
      return NextResponse.json({ discount: discountData }, { status: 200 });
    }
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

    const body = await request.json();
    const {
      code, name, description, type, value,
      minOrderAmount, maxDiscount, usageLimit, perCustomerLimit,
      appliesTo, applicableIds, startsAt, endsAt, isActive,
    } = body;

    let storeId: string = '';
    let discountCode = code;
    let discountName = name;

    try {
      const existing = await db.discount.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;

      // If code is being changed, check for duplicates
      if (code && code.toUpperCase() !== existing.code) {
        const duplicate = await db.discount.findFirst({
          where: { storeId, code: code.toUpperCase(), id: { not: id } },
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

      // Log activity
      const action = isActive !== undefined && isActive !== existing.isActive
        ? (isActive ? 'discount.activated' : 'discount.deactivated')
        : 'discount.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'discount',
        entityId: id,
        entityName: `${discount.code} - ${discount.name}`,
        details: isActive !== undefined && isActive !== existing.isActive ? { isActive } : { updatedFields: Object.keys(body) },
      });

      return NextResponse.json({ discount }, { status: 200 });
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('Discount model not available, using raw SQL fallback:', modelError);

      // Fetch existing discount with store owner info
      const existingRows = await db.$queryRawUnsafe(
        `SELECT d.*, s.ownerId FROM Discount d LEFT JOIN Store s ON d.storeId = s.id WHERE d.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      }

      const existing = existingRows[0];
      if (existing.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existing.storeId);

      // If code is being changed, check for duplicates
      if (code && code.toUpperCase() !== String(existing.code).toUpperCase()) {
        const dupRows = await db.$queryRawUnsafe(
          `SELECT id FROM Discount WHERE storeId = ? AND code = ? AND id != ?`,
          existing.storeId, code.toUpperCase(), id
        ) as Record<string, unknown>[];
        if (dupRows && dupRows.length > 0) {
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

      const discountType = type || String(existing.type);
      const discountValue = value !== undefined ? parseFloat(String(value)) : Number(existing.value);
      if (discountType === 'percentage' && discountValue > 100) {
        return NextResponse.json(
          { error: 'percentage value cannot exceed 100' },
          { status: 400 }
        );
      }

      // Build SET clause dynamically
      const setClauses: string[] = [];
      const setValues: unknown[] = [];

      if (code !== undefined) {
        setClauses.push('code = ?');
        setValues.push(code.toUpperCase());
      }
      if (name !== undefined) {
        setClauses.push('name = ?');
        setValues.push(name);
      }
      if (description !== undefined) {
        setClauses.push('description = ?');
        setValues.push(description || null);
      }
      if (type !== undefined) {
        setClauses.push('type = ?');
        setValues.push(type);
      }
      if (value !== undefined) {
        setClauses.push('value = ?');
        setValues.push(parseFloat(String(value)));
      }
      if (minOrderAmount !== undefined) {
        setClauses.push('minOrderAmount = ?');
        setValues.push(minOrderAmount ? parseFloat(String(minOrderAmount)) : null);
      }
      if (maxDiscount !== undefined) {
        setClauses.push('maxDiscount = ?');
        setValues.push(maxDiscount ? parseFloat(String(maxDiscount)) : null);
      }
      if (usageLimit !== undefined) {
        setClauses.push('usageLimit = ?');
        setValues.push(usageLimit ? parseInt(String(usageLimit)) : null);
      }
      if (perCustomerLimit !== undefined) {
        setClauses.push('perCustomerLimit = ?');
        setValues.push(perCustomerLimit ? parseInt(String(perCustomerLimit)) : null);
      }
      if (appliesTo !== undefined) {
        setClauses.push('appliesTo = ?');
        setValues.push(appliesTo);
      }
      if (applicableIds !== undefined) {
        setClauses.push('applicableIds = ?');
        setValues.push(typeof applicableIds === 'string' ? applicableIds : JSON.stringify(applicableIds));
      }
      if (startsAt !== undefined) {
        setClauses.push('startsAt = ?');
        setValues.push(startsAt ? new Date(startsAt).toISOString() : null);
      }
      if (endsAt !== undefined) {
        setClauses.push('endsAt = ?');
        setValues.push(endsAt ? new Date(endsAt).toISOString() : null);
      }
      if (isActive !== undefined) {
        setClauses.push('isActive = ?');
        setValues.push(isActive ? 1 : 0);
      }

      setClauses.push("updatedAt = datetime('now')");
      setValues.push(id);

      await db.$executeRawUnsafe(
        `UPDATE Discount SET ${setClauses.join(', ')} WHERE id = ?`,
        ...setValues
      );

      // Log activity
      const wasActive = Number(existing.isActive) === 1;
      const action = isActive !== undefined && isActive !== wasActive
        ? (isActive ? 'discount.activated' : 'discount.deactivated')
        : 'discount.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'discount',
        entityId: id,
        entityName: `${code || existing.code} - ${name || existing.name}`,
        details: isActive !== undefined && isActive !== wasActive ? { isActive } : { updatedFields: Object.keys(body) },
      });

      // Fetch updated discount
      const updatedRows = await db.$queryRawUnsafe(
        `SELECT * FROM Discount WHERE id = ?`,
        id
      ) as Record<string, unknown>[];

      return NextResponse.json({ discount: updatedRows?.[0] || {} }, { status: 200 });
    }
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

    let storeId = '';
    let discountCode = '';
    let discountName = '';

    try {
      const existing = await db.discount.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;
      discountCode = existing.code;
      discountName = existing.name;

      await db.discount.delete({ where: { id } });
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('Discount model not available, using raw SQL fallback:', modelError);

      // Check ownership first
      const existingRows = await db.$queryRawUnsafe(
        `SELECT d.*, s.ownerId FROM Discount d LEFT JOIN Store s ON d.storeId = s.id WHERE d.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      }

      if (existingRows[0].ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existingRows[0].storeId);
      discountCode = String(existingRows[0].code);
      discountName = String(existingRows[0].name);

      await db.$executeRawUnsafe(
        `DELETE FROM Discount WHERE id = ?`,
        id
      );
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'discount.deleted',
      entity: 'discount',
      entityId: id,
      entityName: `${discountCode} - ${discountName}`,
    });

    return NextResponse.json({ message: 'Discount deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete discount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
