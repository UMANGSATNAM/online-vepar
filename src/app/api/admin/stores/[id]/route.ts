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

// PATCH /api/admin/stores/[id] - Suspend or activate a store
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error
  const { id } = await params
  const body = await request.json()
  const { isActive } = body
  const store = await db.store.update({ where: { id }, data: { isActive } })
  return NextResponse.json({ store })
}

// DELETE /api/admin/stores/[id] - Permanently delete a store
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error
  const { id } = await params
  await db.store.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
