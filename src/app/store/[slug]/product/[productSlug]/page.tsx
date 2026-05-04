import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ProductPageClient from './ProductPageClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string, productSlug: string }> }) {
  const { productSlug, slug } = await params
  const product = await db.product.findFirst({
    where: { slug: productSlug, store: { slug: slug } },
    select: { name: true, description: true, images: true }
  })
  if (!product) return { title: 'Product Not Found' }
  
  let imageUrl = ''
  try {
    const images = JSON.parse(product.images)
    if (images.length > 0) imageUrl = images[0]
  } catch {}

  return {
    title: product.name,
    description: product.description || `Buy ${product.name}`,
    openGraph: { images: imageUrl ? [imageUrl] : [] }
  }
}

export default async function StoreProductPage({ params }: { params: Promise<{ slug: string, productSlug: string }> }) {
  const { slug, productSlug } = await params
  
  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, currency: true, primaryColor: true, logo: true }
  })
  if (!store) return notFound()

  const product = await db.product.findFirst({
    where: { slug: productSlug, storeId: store.id, status: 'active' },
    include: { categoryRef: true }
  })
  if (!product) return notFound()

  // Fetch cross-sell products
  const relatedProducts = await db.product.findMany({
    where: { 
      storeId: store.id, 
      status: 'active',
      categoryId: product.categoryId,
      id: { not: product.id }
    },
    take: 4,
    include: { categoryRef: true }
  })

  const mappedRelated = relatedProducts.map(p => ({ ...p, storeSlug: slug }))
  const mappedProduct = { ...product, storeSlug: slug }

  return <ProductPageClient store={store} product={mappedProduct} relatedProducts={mappedRelated} />
}
