import { prisma } from '@/lib/prisma'
import type { CartWithItems } from './types'

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
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
    orderBy: { createdAt: 'asc' as const },
  },
}

export async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  })

  if (existing) return existing as CartWithItems

  const created = await prisma.cart.create({
    data: { userId },
    include: cartInclude,
  })

  return created as CartWithItems
}

export async function getCartByUserId(userId: string): Promise<CartWithItems | null> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  })
  return cart as CartWithItems | null
}

export async function addItem(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<CartWithItems> {
  // Verify the variant exists and has enough inventory
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  })

  if (!variant) throw new Error('Variant not found')
  if (variant.inventory <= 0) throw new Error('Item is out of stock')

  const cart = await getOrCreateCart(userId)

  const existingItem = cart.items.find((item) => item.variant.id === variantId)
  const currentQty = existingItem?.quantity ?? 0
  const requestedQty = currentQty + quantity
  // Cap at available inventory
  const finalQty = Math.min(requestedQty, variant.inventory)

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: finalQty },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity: finalQty,
      },
    })
  }

  return getOrCreateCart(userId)
}

export async function updateItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartWithItems> {
  // Verify the item belongs to this user's cart
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  })

  if (!item || item.cart.userId !== userId) {
    throw new Error('Cart item not found')
  }

  // Cap at available inventory
  const finalQty = Math.min(quantity, item.variant.inventory)

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: finalQty },
  })

  return getOrCreateCart(userId)
}

export async function removeItem(userId: string, itemId: string): Promise<CartWithItems> {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!item || item.cart.userId !== userId) {
    throw new Error('Cart item not found')
  }

  await prisma.cartItem.delete({ where: { id: itemId } })

  return getOrCreateCart(userId)
}

export async function clearCart(userId: string): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) return

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
}
