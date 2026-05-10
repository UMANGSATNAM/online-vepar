import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyStoreAccess } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category') || '';
    
    if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });

    const { authorized } = await verifyStoreAccess(storeId, user.id, 'analytics');
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const where: Record<string, unknown> = { storeId };
    if (category && category !== 'all') where.category = category;

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ expenses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { storeId, category, name, amount, date, notes } = body;

    if (!storeId || !category || !name || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { authorized } = await verifyStoreAccess(storeId, user.id, 'settings'); // Or 'analytics'
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const expense = await db.expense.create({
      data: {
        storeId,
        category,
        name,
        amount: parseFloat(String(amount)),
        date: date ? new Date(date) : new Date(),
        notes,
      }
    });

    return NextResponse.json({ expense });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
