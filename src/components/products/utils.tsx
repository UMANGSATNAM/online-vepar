import { Badge } from '@/components/ui/badge'

export function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function parseJSONField(field: string | null | undefined): string[] {
  if (!field) return []
  try {
    const parsed = JSON.parse(field)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 hover:bg-emerald-100">Active</Badge>
    case 'draft':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 hover:bg-gray-100">Draft</Badge>
    case 'archived':
      return <Badge variant="outline" className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">Archived</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function getStockBadge(stock: number, trackInventory: boolean) {
  if (!trackInventory) return <Badge variant="outline" className="text-blue-600 border-blue-300">Not tracked</Badge>
  if (stock <= 0) return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Out of stock</Badge>
  if (stock <= 5) return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Low stock ({stock})</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">In stock ({stock})</Badge>
}
