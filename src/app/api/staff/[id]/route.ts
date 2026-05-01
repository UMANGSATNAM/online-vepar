import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    let staff;
    try {
      staff = await db.staff.findUnique({
        where: { id },
      });
    } catch {
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Staff WHERE id = ? LIMIT 1',
        id
      );
      staff = Array.isArray(results) && results.length > 0 ? results[0] : null;
    }

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify user owns the store this staff belongs to
    const storeId = (staff as Record<string, unknown>).storeId as string;
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error) {
    console.error('Get staff member error:', error);
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
    const { role, permissions, status, name, email } = body;

    // Find existing staff member
    let existing;
    try {
      existing = await db.staff.findUnique({ where: { id } });
    } catch {
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Staff WHERE id = ? LIMIT 1',
        id
      );
      existing = Array.isArray(results) && results.length > 0 ? results[0] : null;
    }

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify user owns the store this staff belongs to
    const storeId = (existing as Record<string, unknown>).storeId as string;
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'manager', 'staff', 'viewer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be: admin, manager, staff, or viewer' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    if (status) {
      updateData.status = status;
      // If status changed to active, set acceptedAt
      if (status === 'active') {
        updateData.acceptedAt = new Date();
      }
    }

    let staff;
    try {
      staff = await db.staff.update({
        where: { id },
        data: updateData,
      });
    } catch {
      // Fallback raw SQL update
      const setClauses: string[] = ['updatedAt = datetime(\'now\')'];
      const sqlParams: unknown[] = [];

      if (role) {
        setClauses.push('role = ?');
        sqlParams.push(role);
      }
      if (name) {
        setClauses.push('name = ?');
        sqlParams.push(name);
      }
      if (email) {
        setClauses.push('email = ?');
        sqlParams.push(email);
      }
      if (permissions) {
        setClauses.push('permissions = ?');
        sqlParams.push(JSON.stringify(permissions));
      }
      if (status) {
        setClauses.push('status = ?');
        sqlParams.push(status);
        if (status === 'active') {
          setClauses.push('acceptedAt = datetime(\'now\')');
        }
      }

      sqlParams.push(id);
      await db.$executeRawUnsafe(
        `UPDATE Staff SET ${setClauses.join(', ')} WHERE id = ?`,
        ...sqlParams
      );

      // Re-fetch updated record
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Staff WHERE id = ? LIMIT 1',
        id
      );
      staff = Array.isArray(results) && results.length > 0 ? results[0] : { id, ...updateData };
    }

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Find existing staff member
    let existing;
    try {
      existing = await db.staff.findUnique({ where: { id } });
    } catch {
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Staff WHERE id = ? LIMIT 1',
        id
      );
      existing = Array.isArray(results) && results.length > 0 ? results[0] : null;
    }

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify user owns the store this staff belongs to
    const storeId = (existing as Record<string, unknown>).storeId as string;
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Cannot delete the store owner (they aren't in Staff table, but just in case)
    const staffRole = (existing as Record<string, unknown>).role as string;
    if (staffRole === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the store owner' },
        { status: 400 }
      );
    }

    try {
      await db.staff.delete({ where: { id } });
    } catch {
      await db.$executeRawUnsafe('DELETE FROM Staff WHERE id = ?', id);
    }

    return NextResponse.json({ message: 'Staff member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
