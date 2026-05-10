import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'superadmin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

// GET /api/admin/domains - List all domains
export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const domains = await db.domain.findMany({
    include: { store: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ domains })
}

// PATCH /api/admin/domains - Verify or update a domain
export async function PATCH(request: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id, isVerified, sslStatus } = await request.json()
  const domain = await db.domain.update({
    where: { id },
    data: { isVerified, sslStatus },
  })
  return NextResponse.json({ domain })
}
