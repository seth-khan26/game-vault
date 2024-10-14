import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import type { CreateOrderInput, OrderDetail, OrderListItem } from './types'
import { ORDER_STATUS_TRANSITIONS } from './types'

const orderDetailInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              images: {
                select: { url: true, alt: true, isPrimary: true },
                orderBy: { sortOrder: 'asc' as const },
              },
            },
          },
        },
      },
    },
  },
  payment: {
    select: {
      id: true,
      provider: true,
      providerOrderId: true,
      status: true,
      amount: true,
      createdAt: true,
    },
  },
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDetail> {
  const orderNumber = generateOrderNumber()

  const order = await prisma.$transaction(async (tx) => {
    // Verify inventory and lock for update
    for (const item of input.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      })

      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`)
      }
      if (variant.inventory < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${item.productTitle} (${item.platform}). Available: ${variant.inventory}`,
        )
      }
    }

    // Create the order
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: 'PENDING_PAYMENT',
        subtotal: input.subtotal,
        shippingCost: input.shippingCost,
        tax: input.tax,
        total: input.total,
        shippingLine1: input.shippingAddress.line1,
        shippingLine2: input.shippingAddress.line2 ?? null,
        shippingCity: input.shippingAddress.city,
        shippingState: input.shippingAddress.state,
        shippingPostal: input.shippingAddress.postalCode,
        shippingCountry: input.shippingAddress.country,
        items: {
          create: input.items.map((item) => ({
            variantId: item.variantId,
            productTitle: item.productTitle,
            platform: item.platform,
            sku: item.sku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: orderDetailInclude,
    })

    // Deduct inventory
    for (const item of input.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { inventory: { decrement: item.quantity } },
      })
    }

    return created
  })

  return order as OrderDetail
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderDetailInclude,
  })
  return order as OrderDetail | null
}

export async function getOrdersByUser(userId: string): Promise<OrderListItem[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          productTitle: true,
          quantity: true,
          platform: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return orders as OrderListItem[]
}

export async function updateOrderStatus(
  id: string,
  newStatus: OrderStatus,
): Promise<OrderDetail> {
  const order = await prisma.order.findUnique({ where: { id } })

  if (!order) throw new Error('Order not found')

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status]
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
    )
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: newStatus },
    include: orderDetailInclude,
  })

  return updated as OrderDetail
}
