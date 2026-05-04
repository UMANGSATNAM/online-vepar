import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import StorefrontPage from '@/components/storefront/StorefrontPage'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await db.store.findUnique({
    where: { slug },
    select: { name: true, seoTitle: true, seoDescription: true, logo: true }
  })
  if (!store) return { title: 'Store Not Found' }
  return {
    title: store.seoTitle || store.name,
    description: store.seoDescription || `Shop at ${store.name}`,
    icons: store.logo ? [{ url: store.logo }] : [],
  }
}

export default async function StoreSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await db.store.findUnique({
    where: { slug, isActive: true },
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

  const mappedStore = {
    ...store,
    products: store.products.map(p => ({ ...p, storeSlug: store.slug }))
  }

  return <StorefrontPage store={mappedStore} />
}
