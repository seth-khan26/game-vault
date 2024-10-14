export interface PaymentIntent {
  providerOrderId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
}

export interface PaymentResult {
  success: boolean
  providerOrderId: string
  status: 'COMPLETED' | 'FAILED'
  error?: string
}

export interface PaymentProvider {
  createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent>
  capturePayment(providerOrderId: string): Promise<PaymentResult>
  refundPayment(providerOrderId: string, amount: number): Promise<PaymentResult>
}
