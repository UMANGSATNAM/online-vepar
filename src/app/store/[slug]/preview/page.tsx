import { db } from '@/lib/db'
import { renderStorefront } from '@/lib/liquid'
import StorefrontClient from './StorefrontClient'
import { notFound } from 'next/navigation'

export default async function StorePreviewPage({ params }: { params: { slug: string } }) {
  const store = await db.store.findUnique({
    where: { slug: params.slug }
  })

  if (!store) {
    notFound()
  }

  // Initial SSR Liquid rendering
  // We pass a basic global context
  const initialHtml = await renderStorefront(store.id, 'index', {
    store: { name: store.name, description: store.description }
  })

  return (
    <StorefrontClient initialHtml={initialHtml} storeId={store.id} />
  )
}
