import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const metadata = { title: 'Super Admin | Online Vepar' }

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/')
  }
  return <SuperAdminDashboard />
}
