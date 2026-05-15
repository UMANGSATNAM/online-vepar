import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Star, Heart, Eye, Plus, Check, Sparkles } from 'lucide-react'
import { StorefrontProduct } from './types'

export function StarRating({ rating, count, size = 'sm' }: { rating: number; count?: number; size?: 'sm' | 'md' | 'lg' }) {
  const starSize = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${starSize} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={`${size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'} text-muted-foreground ml-1`}>
          {count > 0 ? `(${count})` : ''}
        </span>
      )}
    </div>
  )
}

export function ProductCard({
  product,
  primaryColor,
  currencySymbol,
  onOpen,
  onAddToCart,
  inCart,
  isAdded,
}: {
  product: StorefrontProduct
  primaryColor: string
  currencySymbol: string
  onOpen: (p: StorefrontProduct) => void
  onAddToCart: (p: StorefrontProduct) => void
  inCart: number
  isAdded: boolean
}) {
  const outOfStock = product.trackInventory && product.stock <= 0
  const onSale = product.comparePrice && product.comparePrice > product.price
  const discountPercent = onSale ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100) : 0
  const formatPrice = (price: number) => `${currencySymbol}${price.toLocaleString('en-IN')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group ${isAdded ? 'scale-[1.02]' : ''} transition-transform`}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-border/80 cursor-pointer bg-card">
        {/* Product Image */}
        <div
          className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-900"
          onClick={() => onOpen(product)}
        >
          {product.images?.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/15" />
            </div>
          )}

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {onSale && (
              <Badge className="text-white border-0 text-[10px] font-bold" style={{ backgroundColor: '#ef4444' }}>
                -{discountPercent}%
              </Badge>
            )}
            {outOfStock && (
              <Badge className="bg-gray-800/90 text-white border-0 text-[10px]">Sold Out</Badge>
            )}
            {product.featured && !onSale && !outOfStock && (
              <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: primaryColor }}>
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Featured
              </Badge>
            )}
          </div>

          {/* Quick action buttons on hover */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <button className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <Heart className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Quick add on hover (desktop) */}
          {!outOfStock && (
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Button
                className="w-full h-10 text-white text-sm font-medium shadow-xl backdrop-blur-sm"
                style={{ backgroundColor: primaryColor }}
                onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4" onClick={() => onOpen(product)}>
          {/* Category */}
          {product.category && (
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 mb-1">
              {product.category}
            </p>
          )}

          {/* Rating */}
          {(product.avgRating ?? 0) > 0 && (
            <div className="mb-1">
              <StarRating rating={product.avgRating || 0} count={product.reviewCount} />
            </div>
          )}

          <h3 className="font-semibold text-sm line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base" style={{ color: primaryColor }}>
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.comparePrice!)}
              </span>
            )}
          </div>

          {/* Cart indicator */}
          {inCart > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit"
              style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
            >
              <Check className="w-3 h-3" />
              {inCart} in cart
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
