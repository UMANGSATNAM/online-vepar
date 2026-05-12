export interface CategoryData {
  id: string
  name: string
  slug: string
  image?: string | null
  _count?: { products: number }
}

export interface ProductData {
  id: string
  name: string
  slug: string
  description?: string | null
  price: number
  comparePrice?: number | null
  cost?: number | null
  images: string
  category?: string | null
  tags: string
  sku?: string | null
  barcode?: string | null
  stock: number
  trackInventory: boolean
  weight?: number | null
  weightUnit: string
  status: string
  featured: boolean
  storeId: string
  categoryId?: string | null
  categoryRef?: CategoryData | null
  createdAt: string
  updatedAt: string
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface VariantData {
  id: string
  productId: string
  storeId: string
  name: string
  sku: string | null
  price: number | null
  comparePrice: number | null
  stock: number
  options: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VariantFormData {
  name: string
  sku: string
  price: string
  comparePrice: string
  stock: string
  options: { key: string; value: string }[]
  position: number
  isActive: boolean
}

export type ViewMode = 'list' | 'form' | 'detail'
export type DisplayMode = 'grid' | 'table'

export interface ProductFormData {
  name: string
  description: string
  price: string
  comparePrice: string
  cost: string
  images: string[]
  category: string
  tags: string[]
  sku: string
  barcode: string
  stock: string
  trackInventory: boolean
  continueOOS: boolean
  weight: string
  weightUnit: string
  status: string
  featured: boolean
  categoryId: string
  hsnCode: string
  gstRate: string
  codEnabled: boolean
  originCountry: string
  collectionIds?: string[]
}

export const emptyFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  cost: '',
  images: [],
  category: '',
  tags: [],
  sku: '',
  barcode: '',
  stock: '0',
  trackInventory: true,
  continueOOS: false,
  weight: '',
  weightUnit: 'kg',
  status: 'draft',
  featured: false,
  categoryId: '',
  hsnCode: '',
  gstRate: '',
  codEnabled: true,
  originCountry: 'IN',
  collectionIds: [],
}
