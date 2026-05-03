import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import StorefrontPage from '@/components/storefront/StorefrontPage'

export default async function StoreDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const domainRecord = await db.domain.findUnique({
    where: { domain, isVerified: true },
    include: { store: true }
  })
  if (!domainRecord) return notFound()

  const store = await db.store.findUnique({
    where: { id: domainRecord.storeId, isActive: true },
    include: {
      products: {
        where: { status: 'active' },
        include: { categoryRef: true },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      },
      categories: { orderBy: { createdAt: 'asc' } },
      collections: { where: { status: 'active' } },
    }
  })

  if (!store) return notFound()
  return <StorefrontPage store={store} />
}
