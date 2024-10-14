import type { PaymentIntent, PaymentProvider, PaymentResult } from './types'

export class MockPaymentProvider implements PaymentProvider {
  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent> {
    // Simulate a small async delay
    await new Promise((resolve) => setTimeout(resolve, 50))

    return {
      providerOrderId: `mock_${orderId}_${Date.now()}`,
      amount,
      currency: 'USD',
      status: 'pending',
    }
  }

  async capturePayment(providerOrderId: string): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Mock always succeeds
    return {
      success: true,
      providerOrderId,
      status: 'COMPLETED',
    }
  }

  async refundPayment(providerOrderId: string, _amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Mock always succeeds
    return {
      success: true,
      providerOrderId: `refund_${providerOrderId}`,
      status: 'COMPLETED',
    }
  }
}

export const mockProvider = new MockPaymentProvider()
