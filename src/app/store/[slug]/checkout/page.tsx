import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import StorefrontCheckout from '@/components/storefront/StorefrontCheckout'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await db.store.findUnique({
    where: { slug },
    select: { name: true }
  })
  return { title: store ? `Checkout — ${store.name}` : 'Checkout' }
}

export default async function CheckoutRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      primaryColor: true,
      currency: true,
      description: true,
      theme: true,
    }
  })
  if (!store) return notFound()

  return <StorefrontCheckout store={store} />
}
