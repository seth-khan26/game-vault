import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { CatalogFilters, PaginatedProducts, ProductDetail, ProductListItem } from './types'

const productSelect = {
  id: true,
  title: true,
  slug: true,
  developer: true,
  publisher: true,
  releaseDate: true,
  status: true,
  isFeatured: true,
  images: {
    select: { url: true, alt: true, isPrimary: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  genres: {
    select: { id: true, name: true, slug: true },
  },
  variants: {
    select: { id: true, platform: true, sku: true, price: true, inventory: true },
  },
} satisfies Prisma.ProductSelect

const productDetailSelect = {
  ...productSelect,
  description: true,
} satisfies Prisma.ProductSelect

export async function getProducts(filters: CatalogFilters): Promise<PaginatedProducts> {
  const {
    platform,
    genre,
    minPrice,
    maxPrice,
    year,
    availability,
    sort = 'newest',
    q,
    page = 1,
    limit = 12,
  } = filters

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { developer: { contains: q, mode: 'insensitive' } },
      { publisher: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (genre) {
    where.genres = { some: { slug: genre } }
  }

  if (year) {
    where.releaseDate = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    }
  }

  const variantFilter: Prisma.ProductVariantWhereInput = {}

  if (platform) {
    variantFilter.platform = platform
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    variantFilter.price = {}
    if (minPrice !== undefined) variantFilter.price.gte = minPrice
    if (maxPrice !== undefined) variantFilter.price.lte = maxPrice
  }

  if (availability === 'in-stock') {
    variantFilter.inventory = { gt: 0 }
  }

  if (Object.keys(variantFilter).length > 0) {
    where.variants = { some: variantFilter }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    { createdAt: 'desc' }

  if (sort === 'newest') {
    orderBy = { releaseDate: 'desc' }
  } else if (sort === 'price_asc') {
    orderBy = { variants: { _count: 'asc' } }
  } else if (sort === 'price_desc') {
    orderBy = { variants: { _count: 'desc' } }
  } else if (sort === 'popularity') {
    orderBy = { variants: { _count: 'desc' } }
  } else if (sort === 'relevance' && q) {
    orderBy = { title: 'asc' }
  }

  const skip = (page - 1) * limit

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  // For price sorts, sort in-memory since Prisma can't sort by variant price directly
  let sorted = products as ProductListItem[]
  if (sort === 'price_asc') {
    sorted = products.sort((a, b) => {
      const aMin = Math.min(...a.variants.map((v) => Number(v.price)))
      const bMin = Math.min(...b.variants.map((v) => Number(v.price)))
      return aMin - bMin
    })
  } else if (sort === 'price_desc') {
    sorted = products.sort((a, b) => {
      const aMin = Math.min(...a.variants.map((v) => Number(v.price)))
      const bMin = Math.min(...b.variants.map((v) => Number(v.price)))
      return bMin - aMin
    })
  }

  return {
    products: sorted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug, status: 'ACTIVE' },
    select: productDetailSelect,
  })
  return product as ProductDetail | null
}

export async function getRelatedProducts(
  productId: string,
  genreIds: string[],
  limit = 4,
): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: productId },
      genres: { some: { id: { in: genreIds } } },
    },
    select: productSelect,
    take: limit,
    orderBy: { releaseDate: 'desc' },
  })
  return products as ProductListItem[]
}

export async function getFeaturedProducts(limit = 6): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', isFeatured: true },
    select: productSelect,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
  return products as ProductListItem[]
}

export async function getNewReleases(limit = 8): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: productSelect,
    take: limit,
    orderBy: { releaseDate: 'desc' },
  })
  return products as ProductListItem[]
}

export async function getPopularProducts(limit = 8): Promise<ProductListItem[]> {
  // Popularity = most order items sold
  const popularVariants = await prisma.orderItem.groupBy({
    by: ['variantId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit * 3, // fetch more to account for deduplication
  })

  if (popularVariants.length === 0) {
    return getNewReleases(limit)
  }

  const variantIds = popularVariants.map((v) => v.variantId)

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { productId: true },
    distinct: ['productId'],
  })

  const productIds = variants.map((v) => v.productId).slice(0, limit)

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'ACTIVE' },
    select: productSelect,
  })

  // Preserve popularity order
  const productMap = new Map(products.map((p) => [p.id, p]))
  const ordered = productIds
    .map((id) => productMap.get(id))
    .filter(Boolean) as ProductListItem[]

  return ordered
}

export async function getGenres() {
  return prisma.genre.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })
}
