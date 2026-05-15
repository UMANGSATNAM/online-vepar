import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const store = await db.store.findFirst({
    where: { ownerId: user.id },
  });

  // If no store, we still render DashboardLayout, and it handles the blank state or redirects
  // Alternatively we could handle it here, but DashboardLayout is designed for the full experience.
  
  return <DashboardLayout />;
}
