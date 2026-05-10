import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';
import { sendAbandonedCartRecoveryEmail } from '@/lib/email';

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
      const cart = await db.abandonedCart.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!cart) {
        return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
      }

      if (cart.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { store: _store, ...cartData } = cart;
      return NextResponse.json({ cart: cartData }, { status: 200 });
    } catch {
      // Fallback to raw SQL
      const rows = await db.$queryRawUnsafe(
        `SELECT ac.*, s.ownerId FROM AbandonedCart ac LEFT JOIN Store s ON ac.storeId = s.id WHERE ac.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
      }

      const row = rows[0];
      if (row.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { ownerId, ...cartData } = row;
      return NextResponse.json({ cart: cartData }, { status: 200 });
    }
  } catch (error) {
    console.error('Get abandoned cart error:', error);
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
    const { status, notes, sendReminder } = body;

    let storeId = '';

    try {
      const existing = await db.abandonedCart.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true, name: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;

      const updateData: Record<string, unknown> = {};

      if (status) {
        updateData.status = status;
        if (status === 'recovered') {
          updateData.recoveredAt = new Date();
        }
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      // Send reminder action
      if (sendReminder) {
        updateData.status = 'email_sent';
        updateData.emailSentAt = new Date();
        updateData.reminderCount = (existing.reminderCount || 0) + 1;
        updateData.lastReminderAt = new Date();

        // Attempt to send the actual email via Resend
        let itemsList = [];
        try {
          itemsList = existing.items ? JSON.parse(existing.items) : [];
        } catch(e) {}
        
        await sendAbandonedCartRecoveryEmail(
          existing.customerEmail,
          existing.customerName || '',
          existing.store.name || 'Your Store',
          existing.recoveryUrl || '',
          itemsList
        );
      }

      const cart = await db.abandonedCart.update({
        where: { id },
        data: updateData,
      });

      // Log activity
      const action = status === 'recovered'
        ? 'abandoned_cart.recovered'
        : sendReminder
          ? 'abandoned_cart.reminder_sent'
          : 'abandoned_cart.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'abandoned_cart',
        entityId: id,
        entityName: existing.customerEmail,
        details: sendReminder
          ? { reminderCount: (existing.reminderCount || 0) + 1 }
          : status === 'recovered'
            ? { total: existing.total }
            : { updatedFields: Object.keys(body) },
      });

      return NextResponse.json({ cart }, { status: 200 });
    } catch {
      // Fallback to raw SQL
      const existingRows = await db.$queryRawUnsafe(
        `SELECT ac.*, s.ownerId FROM AbandonedCart ac LEFT JOIN Store s ON ac.storeId = s.id WHERE ac.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
      }

      const existing = existingRows[0];
      if (existing.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existing.storeId);

      const setClauses: string[] = [];
      const setValues: unknown[] = [];

      if (status) {
        setClauses.push('status = ?');
        setValues.push(status);
        if (status === 'recovered') {
          setClauses.push('recoveredAt = datetime("now")');
        }
      }

      if (notes !== undefined) {
        setClauses.push('notes = ?');
        setValues.push(notes);
      }

      if (sendReminder) {
        setClauses.push('status = ?');
        setValues.push('email_sent');
        setClauses.push('emailSentAt = datetime("now")');
        setClauses.push('reminderCount = ?');
        setValues.push(Number(existing.reminderCount || 0) + 1);
        setClauses.push('lastReminderAt = datetime("now")');

        // Attempt to send the actual email via Resend
        let itemsList = [];
        try {
          itemsList = existing.items ? JSON.parse(String(existing.items)) : [];
        } catch(e) {}
        
        // Fetch store name
        const storeRows = await db.$queryRawUnsafe('SELECT name FROM Store WHERE id = ?', existing.storeId) as any[];
        const storeName = storeRows?.[0]?.name || 'Your Store';

        await sendAbandonedCartRecoveryEmail(
          String(existing.customerEmail),
          String(existing.customerName || ''),
          storeName,
          String(existing.recoveryUrl || ''),
          itemsList
        );
      }

      setClauses.push("updatedAt = datetime('now')");
      setValues.push(id);

      await db.$executeRawUnsafe(
        `UPDATE AbandonedCart SET ${setClauses.join(', ')} WHERE id = ?`,
        ...setValues
      );

      // Log activity
      const action = status === 'recovered'
        ? 'abandoned_cart.recovered'
        : sendReminder
          ? 'abandoned_cart.reminder_sent'
          : 'abandoned_cart.updated';
      await logActivity({
        storeId,
        userId: user.id,
        userName: user.name,
        action,
        entity: 'abandoned_cart',
        entityId: id,
        entityName: String(existing.customerEmail),
        details: sendReminder
          ? { reminderCount: Number(existing.reminderCount || 0) + 1 }
          : status === 'recovered'
            ? { total: existing.total }
            : { updatedFields: Object.keys(body) },
      });

      const updatedRows = await db.$queryRawUnsafe(
        `SELECT * FROM AbandonedCart WHERE id = ?`,
        id
      ) as Record<string, unknown>[];

      return NextResponse.json({ cart: updatedRows?.[0] || {} }, { status: 200 });
    }
  } catch (error) {
    console.error('Update abandoned cart error:', error);
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
    let cartEmail = '';

    try {
      const existing = await db.abandonedCart.findUnique({
        where: { id },
        include: { store: { select: { ownerId: true, id: true } } },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
      }

      if (existing.store.ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = existing.storeId || existing.store.id;
      cartEmail = existing.customerEmail;

      await db.abandonedCart.delete({ where: { id } });
    } catch {
      // Fallback to raw SQL
      const existingRows = await db.$queryRawUnsafe(
        `SELECT ac.*, s.ownerId FROM AbandonedCart ac LEFT JOIN Store s ON ac.storeId = s.id WHERE ac.id = ?`,
        id
      ) as Record<string, unknown>[];

      if (!existingRows || existingRows.length === 0) {
        return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
      }

      if (existingRows[0].ownerId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      storeId = String(existingRows[0].storeId);
      cartEmail = String(existingRows[0].customerEmail);

      await db.$executeRawUnsafe(
        `DELETE FROM AbandonedCart WHERE id = ?`,
        id
      );
    }

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'abandoned_cart.deleted',
      entity: 'abandoned_cart',
      entityId: id,
      entityName: cartEmail,
    });

    return NextResponse.json({ message: 'Abandoned cart deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete abandoned cart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
