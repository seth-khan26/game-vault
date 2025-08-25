# Checkout

## Flow

```
Cart review
      ↓
Shipping address form (React Hook Form + Zod)
      ↓
POST /api/checkout
      ↓
checkoutService.processCheckout()
  1. Fetch cart from DB (not from client)
  2. Validate inventory still available for each item
  3. Calculate totals server-side
  4. Create order + deduct inventory (single transaction)
  5. Process payment via PaymentService
  6. Update order status (PAID or CANCELLED)
  7. Optionally save shipping address
  8. Clear cart on success
      ↓
Redirect to /orders/[id]?success=true
```

## The processCheckout Orchestrator

`src/modules/checkout/service.ts` coordinates the entire flow. It is the only place that knows about all three downstream modules: `cart`, `orders`, and `payments`. This is intentional — the three modules don't know about each other.

### Step 1 — Fetch the Cart from the Database

The checkout service ignores any cart state the client might have sent. It fetches fresh from the database:

```typescript
const cart = await cartRepository.getOrCreateCart(userId)
if (cart.items.length === 0) throw new Error('Cart is empty')
```

This prevents a client submitting a checkout with an empty or manipulated cart payload.

### Step 2 — Inventory Pre-check

Before creating anything, the service validates inventory:

```typescript
for (const item of cart.items) {
  if (item.variant.inventory < item.quantity) {
    throw new Error(
      `Insufficient inventory for "${item.variant.product.title}" (${item.variant.platform}). ` +
      `Requested: ${item.quantity}, Available: ${item.variant.inventory}`
    )
  }
}
```

This is a fast check against the current inventory number. It does not lock rows — the actual atomic deduction happens inside the `createOrder` transaction in step 4. The pre-check gives a fast, human-readable error if inventory is obviously insufficient before going into the transaction.

### Step 3 — Server-Side Total Calculation

```typescript
const subtotal = cart.items.reduce(
  (sum, item) => sum + Number(item.variant.price) * item.quantity, 0
)
const { shippingCost, tax, total } = calculateCartTotals(subtotal)
```

Prices come from `ProductVariant.price` in the database, not from anything the client submitted. The client displays a total for UX purposes, but the server independently calculates the real total.

### Step 4 — Create Order in a Transaction

The order is created and inventory is deducted atomically:

```typescript
const order = await prisma.$transaction(async (tx) => {
  // Re-verify inventory inside the transaction
  for (const item of input.items) {
    const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
    if (variant.inventory < item.quantity) throw new Error(...)
  }

  // Create order + all order items in one statement
  const created = await tx.order.create({ data: { ... } })

  // Deduct inventory
  for (const item of input.items) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { inventory: { decrement: item.quantity } },
    })
  }

  return created
})
```

The inventory check happens twice — once in the service (step 2) and once inside the transaction. The outer check gives fast feedback. The inner check inside the transaction is the real guard against race conditions: two users simultaneously checking out the last copy of a game cannot both succeed, because the second transaction will see `inventory < quantity` and throw.

### Step 5 — Payment Processing

```typescript
try {
  paymentResult = await paymentService.processPayment(order.id, total)
} catch {
  await orderRepository.updateOrderStatus(order.id, 'CANCELLED')
  throw new Error('Payment processing failed. Please try again.')
}
```

If the payment provider throws (network error, timeout, provider down), the order is set to `CANCELLED`. The inventory is not restored in the MVP — this is a simplification. In production, a CANCELLED order would trigger an inventory restoration job.

### Step 6 — Update Order Status

```typescript
const newOrderStatus = paymentResult.success ? 'PAID' : 'CANCELLED'
await orderRepository.updateOrderStatus(order.id, newOrderStatus)
```

The order transitions from `PENDING_PAYMENT` to `PAID` (or `CANCELLED` on payment failure). Status transitions are validated by the order module's state machine — see [orders.md](./orders.md).

### Steps 7–8 — Save Address and Clear Cart

The shipping address is optionally saved to the user's address book. The cart is cleared only on payment success — if payment fails, the user's cart is preserved so they can retry.

## What the Client Submits

```typescript
// checkoutSchema (src/lib/validations.ts)
{
  shippingAddress: {
    line1: string,
    line2?: string,
    city: string,
    state: string,
    postalCode: string,
    country: string,
  },
  saveAddress?: boolean
}
```

The client submits **only** the shipping address. Price, items, user ID, and totals are never in the request body — they are all derived server-side.

## Error Responses

| Status | Condition |
|---|---|
| `400` | Cart is empty, or validation failed |
| `401` | Not authenticated |
| `402` | Payment failed (order was created but payment declined) |
| `409` | Insufficient inventory (detected at checkout time) |
| `500` | Unexpected error |

## Race Condition Handling

Two users attempting to buy the last unit of a game simultaneously:

1. Both pass the pre-check (inventory = 1)
2. Both enter the transaction
3. One transaction commits first, setting inventory to 0
4. The second transaction reads `inventory = 0` inside the transaction
5. Second transaction throws `Insufficient inventory`, rolls back
6. Second user receives a 409 response

The database transaction with the re-check inside guarantees that inventory can never go negative due to concurrent requests.

## Checkout

Inventory reserved on checkout start. Released if payment fails.
