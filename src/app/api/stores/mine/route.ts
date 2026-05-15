import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const store = await db.store.findFirst({
    where: { ownerId: user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      status: true,
      trialStartedAt: true,
      trialEndsAt: true,
    },
  });

  if (!store) return NextResponse.json({ store: null });

  return NextResponse.json({ store });
}
