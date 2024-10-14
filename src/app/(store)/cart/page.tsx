'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function CartPage() {
  const { data: session } = useSession()
  const { cart, loading, updateItem, removeItem } = useCart()

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-text mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary-text mb-2">Your Cart</h1>
        <p className="text-muted-text mb-6">Please sign in to view your cart.</p>
        <Link href="/login?callbackUrl=/cart">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-text mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary-text mb-2">Your cart is empty</h1>
        <p className="text-muted-text mb-6">Start adding some games to your cart!</p>
        <Link href="/games">
          <Button>Browse Games</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary-text mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const image = item.variant.product.images.find((i: any) => i.isPrimary) || item.variant.product.images[0]
            const lineTotal = parseFloat(item.variant.price) * item.quantity

            return (
              <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
                {/* Image */}
                <Link href={`/games/${item.variant.product.slug}`} className="shrink-0">
                  <div className="relative h-24 w-16 rounded overflow-hidden bg-elevated">
                    {image && (
                      <Image src={image.url} alt={image.alt} fill className="object-cover" />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/games/${item.variant.product.slug}`}>
                    <h3 className="font-semibold text-primary-text hover:text-accent transition-colors line-clamp-1">
                      {item.variant.product.title}
                    </h3>
                  </Link>
                  <Badge variant={item.variant.platform === 'PS5' ? 'ps5' : 'ps4'} className="mt-1">
                    {item.variant.platform}
                  </Badge>
                  <p className="text-sm text-muted-text mt-1">{formatPrice(item.variant.price)} each</p>
                </div>

                {/* Quantity controls */}
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-accent">{formatPrice(lineTotal)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                      className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-text hover:text-primary-text hover:bg-elevated"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-primary-text w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => {
                        if (item.quantity < item.variant.inventory) {
                          updateItem(item.id, item.quantity + 1)
                        }
                      }}
                      disabled={item.quantity >= item.variant.inventory}
                      className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-text hover:text-primary-text hover:bg-elevated disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 rounded border border-border flex items-center justify-center text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div>
          <div className="rounded-lg border border-border bg-surface p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-primary-text mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-text">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-text">
                <span>Shipping</span>
                <span>{cart.shippingCost === 0 ? <span className="text-success">Free</span> : formatPrice(cart.shippingCost)}</span>
              </div>
              {cart.subtotal < 100 && (
                <p className="text-xs text-muted-text">Add {formatPrice(100 - cart.subtotal)} more for free shipping</p>
              )}
              <div className="flex justify-between text-muted-text">
                <span>Tax (8%)</span>
                <span>{formatPrice(cart.tax)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-primary-text">
                <span>Total</span>
                <span className="text-accent text-lg">{formatPrice(cart.total)}</span>
              </div>
            </div>
            <Link href="/checkout" className="mt-6 block">
              <Button className="w-full" size="lg">Proceed to Checkout</Button>
            </Link>
            <Link href="/games" className="mt-3 block">
              <Button variant="outline" className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
