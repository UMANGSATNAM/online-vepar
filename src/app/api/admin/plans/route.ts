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

// GET /api/admin/plans - List all subscription plans
export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const plans = await db.subscriptionPlan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json({ plans })
}

// POST /api/admin/plans - Create a new plan
export async function POST(request: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await request.json()
  const { name, price, currency, interval, features } = body

  const plan = await db.subscriptionPlan.create({
    data: {
      name,
      price: parseFloat(price),
      currency: currency || 'INR',
      interval: interval || 'month',
      features: JSON.stringify(features || []),
    },
  })
  return NextResponse.json({ plan }, { status: 201 })
}

// PATCH /api/admin/plans - Update a plan
export async function PATCH(request: NextRequest) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id, ...data } = await request.json()
  if (data.features) data.features = JSON.stringify(data.features)
  if (data.price) data.price = parseFloat(data.price)

  const plan = await db.subscriptionPlan.update({ where: { id }, data })
  return NextResponse.json({ plan })
}
