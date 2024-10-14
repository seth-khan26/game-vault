'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  id: string
  quantity: number
  variant: {
    id: string
    platform: string
    price: string
    inventory: number
    product: {
      title: string
      slug: string
      images: { url: string; alt: string; isPrimary: boolean }[]
    }
  }
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}

export function useCart() {
  const { data: session } = useSession()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setCart(data)
      }
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addToCart = async (variantId: string, quantity: number) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, quantity }),
    })
    if (res.ok) {
      await fetchCart()
      return { success: true }
    }
    const data = await res.json()
    return { success: false, error: data.error }
  }

  const updateItem = async (itemId: string, quantity: number) => {
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    if (res.ok) await fetchCart()
  }

  const removeItem = async (itemId: string) => {
    const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
    if (res.ok) await fetchCart()
  }

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  return { cart, loading, addToCart, updateItem, removeItem, refetch: fetchCart, itemCount }
}
