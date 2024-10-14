import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  AdminCustomer,
  AdminOrder,
  AdminProduct,
  CreateProductInput,
  DashboardStats,
  UpdateProductInput,
} from './types'

const adminProductInclude = {
  images: {
    select: { url: true, alt: true, isPrimary: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  genres: { select: { id: true, name: true, slug: true } },
  variants: {
    select: { id: true, platform: true, sku: true, price: true, inventory: true },
  },
  _count: { select: { variants: true } },
}

const adminOrderInclude = {
  user: { select: { id: true, name: true, email: true } },
  items: {
    select: {
      id: true,
      productTitle: true,
      platform: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
    },
  },
  payment: { select: { status: true, provider: true } },
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalOrdersResult,
    totalProducts,
    totalCustomers,
    lowStockCount,
    recentOrders,
    revenueResult,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.productVariant.count({ where: { inventory: { lte: 5 } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    // Revenue grouped by month (last 6 months)
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
        COALESCE(SUM(total), 0)::float as revenue
      FROM "Order"
      WHERE status NOT IN ('CANCELLED', 'REFUNDED')
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,
  ])

  return {
    totalRevenue: Number(totalOrdersResult._sum.total ?? 0),
    totalOrders: totalOrdersResult._count,
    totalProducts,
    totalCustomers,
    lowStockCount,
    recentOrders,
    revenueByMonth: revenueResult,
  }
}

export async function getProducts(params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ products: AdminProduct[]; total: number }> {
  const { page = 1, limit = 20, status } = params ?? {}
  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = status ? { status: status as Prisma.EnumProductStatusFilter } : {}

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: adminProductInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return { products: products as AdminProduct[], total }
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: adminProductInclude,
  })
  return product as AdminProduct | null
}

export async function createProduct(input: CreateProductInput): Promise<AdminProduct> {
  const product = await prisma.product.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      developer: input.developer,
      publisher: input.publisher,
      releaseDate: new Date(input.releaseDate),
      status: input.status,
      isFeatured: input.isFeatured,
      genres: { connect: input.genreIds.map((id) => ({ id })) },
      images: {
        create: input.images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          sortOrder: i,
        })),
      },
      variants: {
        create: input.variants.map((v) => ({
          platform: v.platform,
          sku: v.sku,
          price: v.price,
          inventory: v.inventory,
        })),
      },
    },
    include: adminProductInclude,
  })
  return product as AdminProduct
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<AdminProduct> {
  const updateData: Prisma.ProductUpdateInput = {}

  if (input.title !== undefined) updateData.title = input.title
  if (input.slug !== undefined) updateData.slug = input.slug
  if (input.description !== undefined) updateData.description = input.description
  if (input.developer !== undefined) updateData.developer = input.developer
  if (input.publisher !== undefined) updateData.publisher = input.publisher
  if (input.releaseDate !== undefined) updateData.releaseDate = new Date(input.releaseDate)
  if (input.status !== undefined) updateData.status = input.status
  if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured

  if (input.genreIds !== undefined) {
    updateData.genres = { set: input.genreIds.map((gid) => ({ id: gid })) }
  }

  if (input.images !== undefined) {
    // Replace all images
    await prisma.productImage.deleteMany({ where: { productId: id } })
    updateData.images = {
      create: input.images.map((img, i) => ({
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        sortOrder: i,
      })),
    }
  }

  if (input.variants !== undefined) {
    // Replace all variants
    await prisma.productVariant.deleteMany({ where: { productId: id } })
    updateData.variants = {
      create: input.variants.map((v) => ({
        platform: v.platform,
        sku: v.sku,
        price: v.price,
        inventory: v.inventory,
      })),
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: adminProductInclude,
  })
  return product as AdminProduct
}

export async function archiveProduct(id: string): Promise<AdminProduct> {
  const product = await prisma.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
    include: adminProductInclude,
  })
  return product as AdminProduct
}

export async function getOrders(params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ orders: AdminOrder[]; total: number }> {
  const { page = 1, limit = 20, status } = params ?? {}
  const skip = (page - 1) * limit

  const where: Prisma.OrderWhereInput = status ? { status: status as Prisma.EnumOrderStatusFilter } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: adminOrderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return { orders: orders as AdminOrder[], total }
}

export async function getCustomers(params?: {
  page?: number
  limit?: number
}): Promise<{ customers: AdminCustomer[]; total: number }> {
  const { page = 1, limit = 20 } = params ?? {}
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
          select: { total: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ])

  const customers: AdminCustomer[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    _count: u._count,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0),
  }))

  return { customers, total }
}
