import { Platform, ProductStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface ProductListItem {
  id: string
  title: string
  slug: string
  developer: string
  publisher: string
  releaseDate: Date
  status: ProductStatus
  isFeatured: boolean
  images: { url: string; alt: string; isPrimary: boolean }[]
  genres: { id: string; name: string; slug: string }[]
  variants: {
    id: string
    platform: Platform
    sku: string
    price: Decimal
    inventory: number
  }[]
}

export interface ProductDetail extends ProductListItem {
  description: string
}

export interface CatalogFilters {
  platform?: Platform
  genre?: string
  minPrice?: number
  maxPrice?: number
  year?: number
  availability?: 'in-stock' | 'all'
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'popularity'
  q?: string
  page?: number
  limit?: number
}

export interface PaginatedProducts {
  products: ProductListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
