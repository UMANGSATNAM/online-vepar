import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/subscriptions/verify - Verify Razorpay payment and activate subscription
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, storeId } = await request.json()

  // Verify signature
  const secret = process.env.RAZORPAY_SECRET || ''
  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const now = new Date()
  const periodEnd = new Date(now)
  if (plan.interval === 'year') periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  else periodEnd.setMonth(periodEnd.getMonth() + 1)

  // Cancel any existing subscription for this store
  await db.storeSubscription.updateMany({
    where: { storeId, status: 'active' },
    data: { status: 'canceled', cancelAtPeriodEnd: true }
  })

  // Create new subscription
  const subscription = await db.storeSubscription.create({
    data: {
      storeId, planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentProvider: 'razorpay',
      providerSubscriptionId: razorpay_payment_id,
      providerCustomerId: user.id,
    }
  })

  // Activate store
  await db.store.update({ where: { id: storeId }, data: { isActive: true } })

  return NextResponse.json({ success: true, subscription })
}
