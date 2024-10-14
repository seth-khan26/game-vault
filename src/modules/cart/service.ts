import { calculateCartTotals } from '@/lib/utils'
import * as cartRepository from './repository'
import type { CartTotals, CartWithItems, CartWithTotals } from './types'

function computeTotals(cart: CartWithItems): CartTotals {
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.variant.price) * item.quantity
  }, 0)

  const { shippingCost, tax, total } = calculateCartTotals(subtotal)
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return { subtotal, shippingCost, tax, total, itemCount }
}

export async function getCart(userId: string): Promise<CartWithTotals> {
  const cart = await cartRepository.getOrCreateCart(userId)
  return { ...cart, totals: computeTotals(cart) }
}

export async function addToCart(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<CartWithTotals> {
  const cart = await cartRepository.addItem(userId, variantId, quantity)
  return { ...cart, totals: computeTotals(cart) }
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartWithTotals> {
  const cart = await cartRepository.updateItem(userId, itemId, quantity)
  return { ...cart, totals: computeTotals(cart) }
}

export async function removeCartItem(userId: string, itemId: string): Promise<CartWithTotals> {
  const cart = await cartRepository.removeItem(userId, itemId)
  return { ...cart, totals: computeTotals(cart) }
}

export async function clearCart(userId: string): Promise<void> {
  return cartRepository.clearCart(userId)
}
