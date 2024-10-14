'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import PlatformSelector from '@/components/shared/PlatformSelector'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/toast'

interface Variant {
  id: string
  platform: 'PS4' | 'PS5'
  sku: string
  price: string
  inventory: number
}

interface AddToCartSectionProps {
  product: {
    id: string
    title: string
    variants: Variant[]
  }
  platforms: ('PS4' | 'PS5')[]
}

export default function AddToCartSection({ product, platforms }: AddToCartSectionProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [selectedPlatform, setSelectedPlatform] = useState<'PS4' | 'PS5'>(platforms[0])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const selectedVariant = product.variants.find((v) => v.platform === selectedPlatform)
  const price = selectedVariant ? parseFloat(selectedVariant.price) : 0
  const inStock = selectedVariant && selectedVariant.inventory > 0
  const maxQty = selectedVariant?.inventory || 0

  const handleAddToCart = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/games/${product.id}`)
      return
    }
    if (!selectedVariant) return

    setLoading(true)
    const result = await addToCart(selectedVariant.id, quantity)
    setLoading(false)

    if (result.success) {
      toast(`${product.title} added to cart!`, 'success')
    } else {
      toast(result.error || 'Failed to add to cart', 'error')
    }
  }

  return (
    <div className="space-y-5">
      {/* Platform selector */}
      {platforms.length > 1 && (
        <div>
          <p className="text-sm text-muted-text mb-2">Platform</p>
          <PlatformSelector
            platforms={platforms}
            selected={selectedPlatform}
            onSelect={(p) => { setSelectedPlatform(p); setQuantity(1) }}
          />
        </div>
      )}

      {/* Price */}
      {selectedVariant && (
        <div>
          <p className="text-3xl font-bold text-accent">{formatPrice(price)}</p>
          {selectedVariant.inventory <= 5 && selectedVariant.inventory > 0 && (
            <p className="text-sm text-yellow-400 mt-1">Only {selectedVariant.inventory} left!</p>
          )}
          {!inStock && <p className="text-sm text-danger mt-1">Out of Stock</p>}
        </div>
      )}

      {/* Quantity */}
      {inStock && (
        <div>
          <p className="text-sm text-muted-text mb-2">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-primary-text hover:bg-elevated"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-primary-text font-medium w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-primary-text hover:bg-elevated"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Add to cart button */}
      <Button
        onClick={handleAddToCart}
        disabled={!inStock || loading}
        size="lg"
        className="w-full gap-2"
      >
        <ShoppingCart className="h-5 w-5" />
        {!inStock ? 'Out of Stock' : loading ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  )
}
