import { Platform } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface CartItemDetail {
  id: string
  quantity: number
  variant: {
    id: string
    platform: Platform
    sku: string
    price: Decimal
    inventory: number
    product: {
      id: string
      title: string
      slug: string
      images: { url: string; alt: string; isPrimary: boolean }[]
    }
  }
}

export interface CartWithItems {
  id: string
  userId: string
  items: CartItemDetail[]
}

export interface CartTotals {
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  itemCount: number
}

export interface CartWithTotals extends CartWithItems {
  totals: CartTotals
}
