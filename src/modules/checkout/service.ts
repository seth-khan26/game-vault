import { prisma } from '@/lib/prisma'
import { calculateCartTotals } from '@/lib/utils'
import * as cartRepository from '@/modules/cart/repository'
import * as orderRepository from '@/modules/orders/repository'
import * as paymentService from '@/modules/payments/service'
import type { CheckoutInput, CheckoutResult } from './types'

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const { userId, shippingAddress, saveAddress } = input

  // 1. Get the user's cart
  const cart = await cartRepository.getOrCreateCart(userId)

  if (cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  // 2. Validate cart items - verify inventory is still available
  for (const item of cart.items) {
    if (item.variant.inventory < item.quantity) {
      throw new Error(
        `Insufficient inventory for "${item.variant.product.title}" (${item.variant.platform}). ` +
          `Requested: ${item.quantity}, Available: ${item.variant.inventory}`,
      )
    }
  }

  // 3. Calculate totals server-side (never trust client)
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0,
  )
  const { shippingCost, tax, total } = calculateCartTotals(subtotal)

  // 4. Create order (with transactional inventory deduction)
  const order = await orderRepository.createOrder({
    userId,
    items: cart.items.map((item) => ({
      variantId: item.variant.id,
      productTitle: item.variant.product.title,
      platform: item.variant.platform,
      sku: item.variant.sku,
      unitPrice: Number(item.variant.price),
      quantity: item.quantity,
    })),
    subtotal,
    shippingCost,
    tax,
    total,
    shippingAddress,
  })

  // 5. Process payment
  let paymentResult: Awaited<ReturnType<typeof paymentService.processPayment>>
  try {
    paymentResult = await paymentService.processPayment(order.id, total)
  } catch {
    // Payment processing error - mark order as cancelled
    await orderRepository.updateOrderStatus(order.id, 'CANCELLED')
    throw new Error('Payment processing failed. Please try again.')
  }

  // 6. Update order status based on payment result
  const newOrderStatus = paymentResult.success ? 'PAID' : 'CANCELLED'
  const updatedOrder = await orderRepository.updateOrderStatus(order.id, newOrderStatus)

  // 7. Optionally save shipping address
  if (saveAddress) {
    await prisma.address.create({
      data: {
        userId,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 ?? null,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
    })
  }

  // 8. Clear the cart on success
  if (paymentResult.success) {
    await cartRepository.clearCart(userId)
  }

  return {
    success: paymentResult.success,
    order: updatedOrder,
    paymentStatus: paymentResult.status,
    error: paymentResult.error,
  }
}
