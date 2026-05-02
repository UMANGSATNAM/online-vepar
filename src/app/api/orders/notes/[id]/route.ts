import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// DELETE /api/orders/notes/[id]
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

    const note = await db.orderNote.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: note.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.orderNote.delete({ where: { id } });

    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete order note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
