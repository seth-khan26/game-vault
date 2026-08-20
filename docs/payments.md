# Payments

## Abstraction Layer

The payments module exposes a `PaymentProvider` interface. No code outside `src/modules/payments/` imports from a specific provider implementation.

```typescript
// src/modules/payments/types.ts
export interface PaymentProvider {
  createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent>
  capturePayment(providerOrderId: string): Promise<PaymentResult>
  refundPayment(providerOrderId: string, amount: number): Promise<PaymentResult>
}
```

The active provider is selected in `src/modules/payments/service.ts`:

```typescript
import { mockProvider } from './mock-provider'

// Swap this line to use Stripe, Braintree, etc.
const provider: PaymentProvider = mockProvider
```

To integrate a real provider, create a class that implements `PaymentProvider` and swap the import. The checkout service, order logic, and database schema require zero changes.

## Mock Provider

The `MockPaymentProvider` simulates a payment processor that always succeeds with a 50ms delay:

```typescript
export class MockPaymentProvider implements PaymentProvider {
  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntent> {
    await delay(50)
    return {
      providerOrderId: `mock_${orderId}_${Date.now()}`,
      amount,
      currency: 'USD',
      status: 'pending',
    }
  }

  async capturePayment(providerOrderId: string): Promise<PaymentResult> {
    await delay(50)
    return { success: true, providerOrderId, status: 'COMPLETED' }
  }

  async refundPayment(providerOrderId: string, _amount: number): Promise<PaymentResult> {
    await delay(50)
    return { success: true, providerOrderId: `refund_${providerOrderId}`, status: 'COMPLETED' }
  }
}
```

The delay is intentional — it makes the checkout feel realistic during development and catches any UI issues with loading states.

## Payment Flow

```typescript
// src/modules/payments/service.ts
export async function processPayment(orderId: string, amount: number): Promise<PaymentResult> {
  // 1. Create a payment intent with the provider
  const intent = await provider.createPaymentIntent(orderId, amount)

  // 2. Record payment as PENDING in DB
  const payment = await prisma.payment.create({
    data: { orderId, provider: 'mock', providerOrderId: intent.providerOrderId,
            status: 'PENDING', amount }
  })

  // 3. Capture (charge) the payment
  const result = await provider.capturePayment(intent.providerOrderId)

  // 4. Update payment status (COMPLETED or FAILED)
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: result.success ? 'COMPLETED' : 'FAILED' }
  })

  // 5. Record payment event for audit log
  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      providerEventId: `evt_${Date.now()}_${randomSuffix}`,
      event: result.success ? 'payment.captured' : 'payment.failed',
    }
  })

  return result
}
```

The payment is recorded as `PENDING` before the capture attempt. If the application crashes between creating the intent and capturing, the payment record exists in `PENDING` state and can be investigated. There is no gap where money was charged but no record exists.

## Idempotency

`PaymentEvent.providerEventId` has a `@unique` constraint. This is the idempotency key for webhook processing:

```
Webhook arrives
      ↓
Verify signature
      ↓
Extract providerEventId
      ↓
SELECT FROM PaymentEvent WHERE providerEventId = ?
      ↓
  Exists? → Return 200 immediately (already processed)
  Missing? → Process transaction → INSERT PaymentEvent
```

Payment providers retry webhook delivery if they receive anything other than 2xx. Without idempotency, a retry could process the same payment event twice — double-fulfilling an order or issuing a double refund.

## Security Rules

The system never stores:
- Card numbers
- CVV codes
- Raw payment credentials
- Full PAN (Primary Account Number)

The application receives only the `providerOrderId` (an opaque reference like `pi_3N...` in Stripe). All actual card data is collected and stored on the payment provider's PCI-compliant servers.

The `amount` passed to the payment provider is **always calculated server-side** from `ProductVariant.price`, never taken from client input. A client cannot manipulate the charge amount.

## Refunds

```typescript
export async function refundPayment(orderId: string): Promise<PaymentResult> {
  const payment = await prisma.payment.findUnique({ where: { orderId } })

  if (!payment || !payment.providerOrderId) throw new Error('Payment not found')
  if (payment.status !== 'COMPLETED') throw new Error('Only completed payments can be refunded')

  const result = await provider.refundPayment(payment.providerOrderId, Number(payment.amount))

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: result.success ? 'REFUNDED' : 'FAILED' }
  })

  await prisma.paymentEvent.create({ ... })

  return result
}
```

The guard `payment.status !== 'COMPLETED'` prevents refunding an already-refunded payment or a failed payment.

## Switching to Stripe

To add Stripe support:

1. Create `src/modules/payments/stripe-provider.ts` implementing `PaymentProvider`
2. Install `stripe` package
3. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`
4. Swap the provider in `service.ts`: `const provider: PaymentProvider = stripeProvider`
5. Update the webhook route at `/api/webhooks/stripe` to verify the Stripe signature and call `paymentService` functions

No other files change.

## Stripe

Payment intents with webhook confirmation. No card data on server.
