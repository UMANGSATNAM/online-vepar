import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Star, ImageIcon, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { ProductData } from './types'
import { parseJSONField, formatPrice, getStockBadge, getStatusBadge } from './utils'

interface ProductGridProps {
  products: ProductData[]
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  openDetail: (id: string) => void
  openEditForm: (product: ProductData) => void
  handleDeleteProduct: (id: string) => void
}

export function ProductGrid({
  products,
  selectedIds,
  toggleSelect,
  openDetail,
  openEditForm,
  handleDeleteProduct
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {products.map((product, idx) => {
        const images = parseJSONField(product.images)
        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
          >
            <Card className="group overflow-hidden card-premium animate-card-entrance border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800">
              {/* Image */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* Checkbox overlay */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                    className="bg-white/80 dark:bg-black/50 border-gray-300"
                  />
                </div>
                {/* Featured badge */}
                {product.featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500 text-white border-0 text-[10px] px-1.5">
                      <Star className="w-3 h-3 mr-0.5" /> Featured
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => openDetail(product.id)}
                  >
                    {product.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(product.id)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditForm(product)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{product.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {product.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(product.price)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {getStockBadge(product.stock, product.trackInventory)}
                  {getStatusBadge(product.status)}
                </div>

                {product.categoryRef && (
                  <Badge variant="outline" className="text-[10px]">
                    {product.categoryRef.name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
