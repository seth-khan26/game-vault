import { Platform } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface InventoryItem {
  id: string
  platform: Platform
  sku: string
  price: Decimal
  inventory: number
  product: {
    id: string
    title: string
    slug: string
    status: string
  }
}

export interface InventoryAdjustment {
  variantId: string
  inventory: number
  reason?: string
}

export interface LowStockItem extends InventoryItem {
  threshold: number
}
