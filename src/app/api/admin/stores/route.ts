import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || false) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

// GET /api/admin/stores - List all stores with details
export async function GET(request: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') // active, suspended

  const where: Record<string, unknown> = {}
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }]
  if (status === 'active') where.isActive = true
  if (status === 'suspended') where.isActive = false

  const [stores, total] = await Promise.all([
    db.store.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { products: true, orders: true, customers: true } },
        subscriptions: { where: { status: 'active' }, include: { plan: true }, take: 1 },
        domains: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.store.count({ where }),
  ])

  return NextResponse.json({ stores, total, page, limit, pages: Math.ceil(total / limit) })
}
