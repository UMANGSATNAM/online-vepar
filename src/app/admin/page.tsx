import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import AdminLogin from '@/components/admin/AdminLogin'

export const metadata = { title: 'Super Admin | Online Vepar' }

export default async function AdminPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <AdminLogin />
  }
  
  return <SuperAdminDashboard />
}
