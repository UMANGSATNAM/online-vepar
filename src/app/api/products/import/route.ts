import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

interface ParsedProduct {
  handle: string
  title: string
  description: string
  category: string
  price: number
  comparePrice: number | null
  sku: string
  barcode: string
  quantity: number
  imageUrl: string
  status: string
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/)
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  })
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const storeId = formData.get('storeId') as string | null

    if (!file || !storeId) {
      return NextResponse.json({ error: 'file and storeId are required' }, { status: 400 })
    }

    // Verify store ownership
    const store = await db.store.findFirst({ where: { id: storeId, userId: user.id } })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one product row' }, { status: 400 })
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'))
    const expectedHeaders = ['handle', 'title', 'description', 'category', 'price', 'compare_at_price', 'sku', 'barcode', 'quantity', 'image_url', 'status']

    // Flexible header mapping
    const getCol = (row: string[], name: string): string => {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase().replace(/\s/g, '_')))
      return idx >= 0 ? (row[idx] || '').trim() : ''
    }

    const products: ParsedProduct[] = []
    const errors: { row: number; message: string }[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.every(c => !c)) continue // skip blank rows

      const title = getCol(row, 'title')
      if (!title) {
        errors.push({ row: i + 1, message: 'Title is required' })
        continue
      }

      const priceStr = getCol(row, 'price')
      const price = parseFloat(priceStr)
      if (isNaN(price) || price < 0) {
        errors.push({ row: i + 1, message: `Invalid price: "${priceStr}"` })
        continue
      }

      const compareStr = getCol(row, 'compare')
      const comparePrice = compareStr ? parseFloat(compareStr) : null

      const qty = parseInt(getCol(row, 'quantity'), 10)
      const statusRaw = getCol(row, 'status').toLowerCase()
      const status = ['active', 'draft', 'archived'].includes(statusRaw) ? statusRaw : 'active'

      products.push({
        handle: getCol(row, 'handle') || slugify(title),
        title,
        description: getCol(row, 'description'),
        category: getCol(row, 'category'),
        price,
        comparePrice: isNaN(comparePrice as number) ? null : (comparePrice as number),
        sku: getCol(row, 'sku'),
        barcode: getCol(row, 'barcode'),
        quantity: isNaN(qty) ? 0 : qty,
        imageUrl: getCol(row, 'image'),
        status,
      })
    }

    if (products.length === 0) {
      return NextResponse.json({ error: 'No valid products found in CSV', errors }, { status: 400 })
    }

    // Resolve or create categories
    const categoryNames = [...new Set(products.map(p => p.category).filter(Boolean))]
    const categoryMap: Record<string, string> = {}

    for (const name of categoryNames) {
      let cat = await db.category.findFirst({ where: { storeId, name } })
      if (!cat) {
        cat = await db.category.create({ data: { storeId, name, description: '' } })
      }
      categoryMap[name] = cat.id
    }

    // Bulk insert products (skip duplicates by sku)
    let created = 0
    let skipped = 0
    const importErrors: { row: number; message: string }[] = [...errors]

    for (let idx = 0; idx < products.length; idx++) {
      const p = products[idx]

      // Check for duplicate SKU
      if (p.sku) {
        const existing = await db.product.findFirst({ where: { storeId, sku: p.sku } })
        if (existing) {
          skipped++
          importErrors.push({ row: idx + 2, message: `SKU "${p.sku}" already exists — skipped` })
          continue
        }
      }

      await db.product.create({
        data: {
          storeId,
          name: p.title,
          slug: p.handle || slugify(p.title),
          description: p.description,
          price: p.price,
          comparePrice: p.comparePrice,
          sku: p.sku || null,
          barcode: p.barcode || null,
          stock: p.quantity,
          images: p.imageUrl ? JSON.stringify([p.imageUrl]) : '[]',
          status: p.status,
          categoryId: p.category ? categoryMap[p.category] : null,
          trackInventory: true,
          featured: false,
          weight: 0,
          tags: '[]',
        },
      })
      created++
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: importErrors,
      total: products.length + errors.length,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
