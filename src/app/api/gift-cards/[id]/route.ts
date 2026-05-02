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

    let giftCard;
    try {
      giftCard = await db.giftCard.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, name: true } } },
      });
    } catch {
      const rows = await db.$queryRawUnsafe(
        `SELECT g.*, s.ownerId, s.name as storeName FROM GiftCard g LEFT JOIN Store s ON g.storeId = s.id WHERE g.id = ?`,
        id
      ) as Record<string, unknown>[];
      giftCard = rows && rows.length > 0 ? rows[0] : null;
    }

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    const ownerId = (giftCard as Record<string, unknown>).store
      ? (giftCard as { store: { ownerId: string } }).store.ownerId
      : (giftCard as Record<string, unknown>).ownerId;

    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { store: _store, ownerId: _ownerId, storeName: _storeName, ...giftCardData } = giftCard as Record<string, unknown>;
    return NextResponse.json({ giftCard: giftCardData }, { status: 200 });
  } catch (error) {
    console.error('Get gift card error:', error);
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
      name, description, status, currentBalance, balanceAdjustment,
      balanceReason, recipientName, recipientEmail, senderName, message,
      template, expiresAt, code,
    } = body;

    let storeId = '';
    let gcCode = '';
    let gcName = '';

    try {
      const existing = await db.giftCard.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;
      gcCode = existing.code;
      gcName = existing.name;

      // Validate balance adjustment
      let newBalance = existing.currentBalance;
      if (balanceAdjustment !== undefined) {
        const adj = parseFloat(String(balanceAdjustment));
        newBalance = existing.currentBalance + adj;
        if (newBalance < 0) {
          return NextResponse.json(
            { error: 'Balance adjustment would result in negative balance' },
            { status: 400 }
          );
        }
      } else if (currentBalance !== undefined) {
        newBalance = parseFloat(String(currentBalance));
        if (newBalance < 0) {
          return NextResponse.json(
            { error: 'Current balance cannot be negative' },
            { status: 400 }
          );
        }
      }

      // Validate status transitions
      if (status && !['active', 'redeemed', 'expired', 'disabled'].includes(status)) {
        return NextResponse.json(
          { error: 'status must be one of: active, redeemed, expired, disabled' },
          { status: 400 }
        );
      }

      // If code is being changed, check for duplicates
      if (code && code !== existing.code) {
        const duplicate = await db.giftCard.findFirst({
          where: { storeId, code, id: { not: id } },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: 'A gift card with this code already exists for this store' },
            { status: 409 }
          );
        }
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;
      if (status !== undefined) updateData.status = status;
      if (currentBalance !== undefined || balanceAdjustment !== undefined) updateData.currentBalance = newBalance;
      if (recipientName !== undefined) updateData.recipientName = recipientName || null;
      if (recipientEmail !== undefined) updateData.recipientEmail = recipientEmail || null;
      if (senderName !== undefined) updateData.senderName = senderName || null;
      if (message !== undefined) updateData.message = message || null;
      if (template !== undefined) updateData.template = template;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (code !== undefined) updateData.code = code;

      // Set redeemedAt if status changes to redeemed
      if (status === 'redeemed' && existing.status !== 'redeemed') {
        updateData.redeemedAt = new Date();
        updateData.currentBalance = 0;
      }

      const giftCard = await db.giftCard.update({
        where: { id },
        data: updateData,
      });

      // Log activity
      const action = status && status !== existing.status
        ? `giftcard.status_${status}`
        : balanceAdjustment !== undefined
          ? 'giftcard.balance_adjusted'
          : 'giftcard.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'giftcard',
        entityId: id,
        entityName: `${giftCard.code} - ${giftCard.name}`,
        details: balanceAdjustment !== undefined
          ? { adjustment: balanceAdjustment, reason: balanceReason, newBalance }
          : status && status !== existing.status
            ? { from: existing.status, to: status }
            : { updatedFields: Object.keys(body) },
      });

      return NextResponse.json({ giftCard }, { status: 200 });
    } catch (modelError) {
      // Fallback to raw SQL if Prisma model is not available
      console.warn('GiftCard model not available, using raw SQL fallback:', modelError);

      const existingRows = await db.$queryRawUnsafe(
        `SELECT g.*, s.ownerId FROM GiftCard g LEFT JOIN Store s ON g.storeId = s.id WHERE g.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
      }

      const existing = existingRows[0];
      if (existing.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existing.storeId);
      gcCode = String(existing.code);
      gcName = String(existing.name);

      // Validate balance adjustment
      let newBalance = Number(existing.currentBalance);
      if (balanceAdjustment !== undefined) {
        const adj = parseFloat(String(balanceAdjustment));
        newBalance = Number(existing.currentBalance) + adj;
        if (newBalance < 0) {
          return NextResponse.json(
            { error: 'Balance adjustment would result in negative balance' },
            { status: 400 }
          );
        }
      } else if (currentBalance !== undefined) {
        newBalance = parseFloat(String(currentBalance));
        if (newBalance < 0) {
          return NextResponse.json(
            { error: 'Current balance cannot be negative' },
            { status: 400 }
          );
        }
      }

      // Build SET clause dynamically
      const setClauses: string[] = [];
      const setValues: unknown[] = [];

      if (name !== undefined) { setClauses.push('name = ?'); setValues.push(name); }
      if (description !== undefined) { setClauses.push('description = ?'); setValues.push(description || null); }
      if (status !== undefined) { setClauses.push('status = ?'); setValues.push(status); }
      if (currentBalance !== undefined || balanceAdjustment !== undefined) {
        setClauses.push('currentBalance = ?');
        setValues.push(newBalance);
      }
      if (recipientName !== undefined) { setClauses.push('recipientName = ?'); setValues.push(recipientName || null); }
      if (recipientEmail !== undefined) { setClauses.push('recipientEmail = ?'); setValues.push(recipientEmail || null); }
      if (senderName !== undefined) { setClauses.push('senderName = ?'); setValues.push(senderName || null); }
      if (message !== undefined) { setClauses.push('message = ?'); setValues.push(message || null); }
      if (template !== undefined) { setClauses.push('template = ?'); setValues.push(template); }
      if (expiresAt !== undefined) {
        setClauses.push('expiresAt = ?');
        setValues.push(expiresAt ? new Date(expiresAt).toISOString() : null);
      }
      if (code !== undefined) { setClauses.push('code = ?'); setValues.push(code); }

      // Set redeemedAt if status changes to redeemed
      if (status === 'redeemed' && String(existing.status) !== 'redeemed') {
        setClauses.push('redeemedAt = ?');
        setValues.push(new Date().toISOString());
        setClauses.push('currentBalance = ?');
        setValues.push(0);
      }

      setClauses.push("updatedAt = datetime('now')");
      setValues.push(id);

      await db.$executeRawUnsafe(
        `UPDATE GiftCard SET ${setClauses.join(', ')} WHERE id = ?`,
        ...setValues
      );

      // Log activity
      const action = status && status !== String(existing.status)
        ? `giftcard.status_${status}`
        : balanceAdjustment !== undefined
          ? 'giftcard.balance_adjusted'
          : 'giftcard.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'giftcard',
        entityId: id,
        entityName: `${code || existing.code} - ${name || existing.name}`,
        details: balanceAdjustment !== undefined
          ? { adjustment: balanceAdjustment, reason: balanceReason, newBalance }
          : status && status !== String(existing.status)
            ? { from: existing.status, to: status }
            : { updatedFields: Object.keys(body) },
      });

      const updatedRows = await db.$queryRawUnsafe(
        `SELECT * FROM GiftCard WHERE id = ?`, id
      ) as Record<string, unknown>[];

      return NextResponse.json({ giftCard: updatedRows?.[0] || {} }, { status: 200 });
    }
  } catch (error) {
    console.error('Update gift card error:', error);
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
    let gcCode = '';
    let gcName = '';

    try {
      const existing = await db.giftCard.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;
      gcCode = existing.code;
      gcName = existing.name;

      await db.giftCard.delete({ where: { id } });
    } catch (modelError) {
      console.warn('GiftCard model not available, using raw SQL fallback:', modelError);

      const existingRows = await db.$queryRawUnsafe(
        `SELECT g.*, s.ownerId FROM GiftCard g LEFT JOIN Store s ON g.storeId = s.id WHERE g.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
      }

      if (existingRows[0].ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existingRows[0].storeId);
      gcCode = String(existingRows[0].code);
      gcName = String(existingRows[0].name);

      await db.$executeRawUnsafe(`DELETE FROM GiftCard WHERE id = ?`, id);
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'giftcard.deleted',
      entity: 'giftcard',
      entityId: id,
      entityName: `${gcCode} - ${gcName}`,
    });

    return NextResponse.json({ message: 'Gift card deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete gift card error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
