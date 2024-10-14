import { prisma } from '@/lib/prisma'
import { mockProvider } from './mock-provider'
import type { PaymentProvider, PaymentResult } from './types'

// Use the mock provider by default; swap for real provider in production
const provider: PaymentProvider = mockProvider

export async function processPayment(orderId: string, amount: number): Promise<PaymentResult> {
  // Create payment intent with provider
  const intent = await provider.createPaymentIntent(orderId, amount)

  // Record payment as pending in DB
  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider: 'mock',
      providerOrderId: intent.providerOrderId,
      status: 'PENDING',
      amount,
    },
  })

  // Capture (charge) the payment
  const result = await provider.capturePayment(intent.providerOrderId)

  // Update payment status in DB
  const newStatus = result.success ? 'COMPLETED' : 'FAILED'
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: newStatus },
  })

  // Record payment event
  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      providerEventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      event: result.success ? 'payment.captured' : 'payment.failed',
    },
  })

  return result
}

export async function refundPayment(orderId: string): Promise<PaymentResult> {
  const payment = await prisma.payment.findUnique({ where: { orderId } })

  if (!payment || !payment.providerOrderId) {
    throw new Error('Payment not found for this order')
  }

  if (payment.status !== 'COMPLETED') {
    throw new Error('Only completed payments can be refunded')
  }

  const result = await provider.refundPayment(payment.providerOrderId, Number(payment.amount))

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: result.success ? 'REFUNDED' : 'FAILED' },
  })

  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      providerEventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      event: result.success ? 'payment.refunded' : 'payment.refund_failed',
    },
  })

  return result
}
