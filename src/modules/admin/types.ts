import { OrderStatus, Platform, ProductStatus, Role } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  lowStockCount: number
  recentOrders: RecentOrderItem[]
  revenueByMonth: { month: string; revenue: number }[]
}

export interface RecentOrderItem {
  id: string
  orderNumber: string
  status: OrderStatus
  total: Decimal
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
  }
}

export interface AdminProduct {
  id: string
  title: string
  slug: string
  description: string
  developer: string
  publisher: string
  releaseDate: Date
  status: ProductStatus
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  images: { url: string; alt: string; isPrimary: boolean }[]
  genres: { id: string; name: string; slug: string }[]
  variants: {
    id: string
    platform: Platform
    sku: string
    price: Decimal
    inventory: number
  }[]
  _count: { variants: number }
}

export interface AdminOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  subtotal: Decimal
  shippingCost: Decimal
  tax: Decimal
  total: Decimal
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
  }
  items: {
    id: string
    productTitle: string
    platform: Platform
    quantity: number
    unitPrice: Decimal
    totalPrice: Decimal
  }[]
  payment: {
    status: string
    provider: string
  } | null
}

export interface AdminCustomer {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
  _count: {
    orders: number
  }
  totalSpent: number
}

export interface CreateProductInput {
  title: string
  slug: string
  description: string
  developer: string
  publisher: string
  releaseDate: string
  status: ProductStatus
  isFeatured: boolean
  genreIds: string[]
  images: { url: string; alt: string; isPrimary: boolean }[]
  variants: { platform: Platform; sku: string; price: number; inventory: number }[]
}

export type UpdateProductInput = Partial<CreateProductInput>
