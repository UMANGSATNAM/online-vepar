import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/domains - Get domains for current store
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const storeId = request.nextUrl.searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const store = await db.store.findFirst({ where: { id: storeId, ownerId: user.id } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const domains = await db.domain.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ domains })
}

// POST /api/domains - Add a custom domain
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId, domain } = await request.json()
  if (!storeId || !domain) return NextResponse.json({ error: 'storeId and domain required' }, { status: 400 })

  const store = await db.store.findFirst({ where: { id: storeId, ownerId: user.id } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  // Check duplicate
  const existing = await db.domain.findUnique({ where: { domain } })
  if (existing) return NextResponse.json({ error: 'Domain already registered' }, { status: 409 })

  const newDomain = await db.domain.create({
    data: { storeId, domain, isCustom: true, isVerified: false, sslStatus: 'pending' }
  })

  return NextResponse.json({
    domain: newDomain,
    instructions: {
      type: 'CNAME',
      name: domain.startsWith('www') ? 'www' : '@',
      value: `${store.slug}.onlinevepar.com`,
      message: `Point your domain's DNS CNAME record to ${store.slug}.onlinevepar.com and wait for verification.`
    }
  }, { status: 201 })
}

// DELETE /api/domains - Remove a domain
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domainId } = await request.json()
  const domain = await db.domain.findUnique({ where: { id: domainId }, include: { store: true } })
  if (!domain || domain.store.ownerId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.domain.delete({ where: { id: domainId } })
  return NextResponse.json({ success: true })
}
