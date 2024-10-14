import type { OrderDetail } from '@/modules/orders/types'

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface CheckoutInput {
  userId: string
  shippingAddress: ShippingAddress
  saveAddress?: boolean
}

export interface CheckoutResult {
  success: boolean
  order: OrderDetail
  paymentStatus: 'COMPLETED' | 'FAILED'
  error?: string
}
