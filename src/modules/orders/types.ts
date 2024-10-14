import { OrderStatus, Platform } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface OrderItemDetail {
  id: string
  productTitle: string
  platform: Platform
  sku: string
  unitPrice: Decimal
  quantity: number
  totalPrice: Decimal
  variant: {
    id: string
    product: {
      id: string
      slug: string
      images: { url: string; alt: string; isPrimary: boolean }[]
    }
  }
}

export interface OrderDetail {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  subtotal: Decimal
  shippingCost: Decimal
  tax: Decimal
  total: Decimal
  shippingLine1: string
  shippingLine2: string | null
  shippingCity: string
  shippingState: string
  shippingPostal: string
  shippingCountry: string
  createdAt: Date
  updatedAt: Date
  items: OrderItemDetail[]
  payment: {
    id: string
    provider: string
    providerOrderId: string | null
    status: string
    amount: Decimal
    createdAt: Date
  } | null
}

export interface OrderListItem {
  id: string
  orderNumber: string
  status: OrderStatus
  total: Decimal
  createdAt: Date
  items: { productTitle: string; quantity: number; platform: Platform }[]
}

export interface CreateOrderInput {
  userId: string
  items: {
    variantId: string
    productTitle: string
    platform: Platform
    sku: string
    unitPrice: number
    quantity: number
  }[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}
