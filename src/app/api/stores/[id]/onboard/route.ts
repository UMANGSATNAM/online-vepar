import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get('ov_session')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const body = await request.json()

    // Ensure store belongs to user
    const store = await db.store.findFirst({
      where: { id, ownerId: userId }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 })
    }

    // Update store with onboarding data
    const updatedStore = await db.store.update({
      where: { id },
      data: {
        businessType: body.businessType || null,
        businessCategory: body.businessCategory || null,
        annualTurnoverBand: body.annualTurnoverBand || null,
        skusBand: body.skusBand || null,
        panNumber: body.panNumber || null,
        gstin: body.gstin || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankIfsc: body.bankIfsc || null,
        theme: body.theme || store.theme,
        currency: body.currency || store.currency,
        // Auto-approve KYC for now, in prod this would be 'submitted' requiring manual review or third-party API verify
        kycStatus: 'verified', 
      }
    })

    return NextResponse.json({ store: updatedStore, message: 'Onboarding completed successfully' })
  } catch (error: any) {
    console.error('Onboarding Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
