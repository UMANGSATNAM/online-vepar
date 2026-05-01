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
      const taxRate = await db.taxRate.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true } } },
      });

      if (!taxRate) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }

      if (taxRate.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { store: _store, ...taxRateData } = taxRate;
      return NextResponse.json({ taxRate: taxRateData }, { status: 200 });
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('TaxRate model not available, using raw SQL fallback:', modelError);

      const rows = await db.$queryRawUnsafe(
        `SELECT t.*, s.ownerId FROM TaxRate t LEFT JOIN Store s ON t.storeId = s.id WHERE t.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }

      const row = rows[0];
      if (row.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { ownerId, ...taxRateData } = row;
      return NextResponse.json({ taxRate: taxRateData }, { status: 200 });
    }
  } catch (error) {
    console.error('Get tax rate error:', error);
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
      name, rate, country, state, city, zipCode,
      isCompound, priority, isActive,
    } = body;

    let storeId: string = '';

    try {
      const existing = await db.taxRate.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;

      // If name is being changed, check for duplicates
      if (name && name !== existing.name) {
        const duplicate = await db.taxRate.findFirst({
          where: { storeId, name, id: { not: id } },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: 'A tax rate with this name already exists for this store' },
            { status: 409 }
          );
        }
      }

      if (rate !== undefined && rate <= 0) {
        return NextResponse.json(
          { error: 'Rate must be a positive number' },
          { status: 400 }
        );
      }

      const taxRate = await db.taxRate.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(rate !== undefined && { rate: parseFloat(String(rate)) }),
          ...(country !== undefined && { country: country || null }),
          ...(state !== undefined && { state: state || null }),
          ...(city !== undefined && { city: city || null }),
          ...(zipCode !== undefined && { zipCode: zipCode || null }),
          ...(isCompound !== undefined && { isCompound }),
          ...(priority !== undefined && { priority: parseInt(String(priority)) }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // Log activity
      const action = isActive !== undefined && isActive !== existing.isActive
        ? (isActive ? 'tax_rate.activated' : 'tax_rate.deactivated')
        : 'tax_rate.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'tax_rate',
        entityId: id,
        entityName: name || existing.name,
        details: isActive !== undefined && isActive !== existing.isActive ? { isActive } : { updatedFields: Object.keys(body) },
      });

      return NextResponse.json({ taxRate }, { status: 200 });
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('TaxRate model not available, using raw SQL fallback:', modelError);

      const existingRows = await db.$queryRawUnsafe(
        `SELECT t.*, s.ownerId FROM TaxRate t LEFT JOIN Store s ON t.storeId = s.id WHERE t.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }

      const existing = existingRows[0];
      if (existing.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existing.storeId);

      // If name is being changed, check for duplicates
      if (name && name !== String(existing.name)) {
        const dupRows = await db.$queryRawUnsafe(
          `SELECT id FROM TaxRate WHERE storeId = ? AND name = ? AND id != ?`,
          existing.storeId, name, id
        ) as Record<string, unknown>[];
        if (dupRows && dupRows.length > 0) {
          return NextResponse.json(
            { error: 'A tax rate with this name already exists for this store' },
            { status: 409 }
          );
        }
      }

      if (rate !== undefined && rate <= 0) {
        return NextResponse.json(
          { error: 'Rate must be a positive number' },
          { status: 400 }
        );
      }

      // Build SET clause dynamically
      const setClauses: string[] = [];
      const setValues: unknown[] = [];

      if (name !== undefined) {
        setClauses.push('name = ?');
        setValues.push(name);
      }
      if (rate !== undefined) {
        setClauses.push('rate = ?');
        setValues.push(parseFloat(String(rate)));
      }
      if (country !== undefined) {
        setClauses.push('country = ?');
        setValues.push(country || null);
      }
      if (state !== undefined) {
        setClauses.push('state = ?');
        setValues.push(state || null);
      }
      if (city !== undefined) {
        setClauses.push('city = ?');
        setValues.push(city || null);
      }
      if (zipCode !== undefined) {
        setClauses.push('zipCode = ?');
        setValues.push(zipCode || null);
      }
      if (isCompound !== undefined) {
        setClauses.push('isCompound = ?');
        setValues.push(isCompound ? 1 : 0);
      }
      if (priority !== undefined) {
        setClauses.push('priority = ?');
        setValues.push(parseInt(String(priority)));
      }
      if (isActive !== undefined) {
        setClauses.push('isActive = ?');
        setValues.push(isActive ? 1 : 0);
      }

      setClauses.push("updatedAt = datetime('now')");
      setValues.push(id);

      await db.$executeRawUnsafe(
        `UPDATE TaxRate SET ${setClauses.join(', ')} WHERE id = ?`,
        ...setValues
      );

      // Log activity
      const wasActive = Number(existing.isActive) === 1;
      const action = isActive !== undefined && isActive !== wasActive
        ? (isActive ? 'tax_rate.activated' : 'tax_rate.deactivated')
        : 'tax_rate.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'tax_rate',
        entityId: id,
        entityName: name || String(existing.name),
        details: isActive !== undefined && isActive !== wasActive ? { isActive } : { updatedFields: Object.keys(body) },
      });

      // Fetch updated tax rate
      const updatedRows = await db.$queryRawUnsafe(
        `SELECT * FROM TaxRate WHERE id = ?`,
        id
      ) as Record<string, unknown>[];

      return NextResponse.json({ taxRate: updatedRows?.[0] || {} }, { status: 200 });
    }
  } catch (error) {
    console.error('Update tax rate error:', error);
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
    let taxRateName = '';

    try {
      const existing = await db.taxRate.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;
      taxRateName = existing.name;

      await db.taxRate.delete({ where: { id } });
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('TaxRate model not available, using raw SQL fallback:', modelError);

      const existingRows = await db.$queryRawUnsafe(
        `SELECT t.*, s.ownerId FROM TaxRate t LEFT JOIN Store s ON t.storeId = s.id WHERE t.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }

      if (existingRows[0].ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existingRows[0].storeId);
      taxRateName = String(existingRows[0].name);

      await db.$executeRawUnsafe(
        `DELETE FROM TaxRate WHERE id = ?`,
        id
      );
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'tax_rate.deleted',
      entity: 'tax_rate',
      entityId: id,
      entityName: taxRateName,
    });

    return NextResponse.json({ message: 'Tax rate deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete tax rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
