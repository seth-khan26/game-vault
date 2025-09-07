# Orders

## Order Lifecycle

An order moves through a defined sequence of states. The transitions are enforced server-side — the client cannot put an order into an arbitrary state.

```
PENDING_PAYMENT  ──→  PAID  ──→  PROCESSING  ──→  SHIPPED  ──→  DELIVERED
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                   CANCELLED
                   REFUNDED  (from PAID, DELIVERED)
```

State machine definition:

```typescript
// src/modules/orders/types.ts
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID:            ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING:      ['SHIPPED', 'CANCELLED'],
  SHIPPED:         ['DELIVERED'],
  DELIVERED:       ['REFUNDED'],
  CANCELLED:       [],
  REFUNDED:        [],
}
```

`CANCELLED` and `REFUNDED` are terminal states — no transitions are allowed out of them.

## Transition Enforcement

```typescript
// src/modules/orders/repository.ts
export async function updateOrderStatus(id: string, newStatus: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw new Error('Order not found')

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status]
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${newStatus}. ` +
      `Allowed: ${allowedTransitions.join(', ') || 'none'}`
    )
  }

  return prisma.order.update({ where: { id }, data: { status: newStatus } })
}
```

The check lives in the repository rather than the service because `updateOrderStatus` is called from multiple places (checkout service, admin route handler) and must always be consistent.

## Order Number Generation

Order numbers are human-readable and unique:

```typescript
// src/lib/utils.ts
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GV-${timestamp}-${random}`
}
```

Format: `GV-LHMBHKW8-4BX7`

The timestamp component (base-36 encoded milliseconds) ensures monotonic ordering and collision resistance without requiring a database sequence. The random suffix adds extra collision protection. The `Order.orderNumber UNIQUE` constraint is the final guarantee.

## OrderItem Snapshots

When an order is created, each item captures the state of the product at that moment:

```typescript
items: {
  create: input.items.map((item) => ({
    variantId:    item.variantId,    // FK for analytics
    productTitle: item.productTitle, // snapshot
    platform:     item.platform,     // snapshot
    sku:          item.sku,          // snapshot
    unitPrice:    item.unitPrice,    // snapshot — never changes
    quantity:     item.quantity,
    totalPrice:   item.unitPrice * item.quantity,
  }))
}
```

`unitPrice` is the price that was charged. It is fixed at order creation time. If a product's price changes the next day, historical orders still show the correct price that was paid.

The `variantId` foreign key is retained for analytics (e.g., "how many units of each SKU have we sold?") but is not relied on for displaying order details to the customer.

## Order Detail Query

```typescript
const orderDetailInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: { id: true, slug: true, images: { ... } }
          }
        }
      }
    }
  },
  payment: { select: { id, provider, providerOrderId, status, amount, createdAt } }
}
```

Even though `productTitle`, `platform`, and `unitPrice` are denormalized into `OrderItem`, the detail query still joins back to `variant.product` to get the current cover image and slug. Images and slugs can change (a product can have its images updated) without affecting the financial integrity of the order.

## Customer Order History

`getOrdersByUser` fetches a summary list — just enough to display in the order history table:

```typescript
select: {
  id, orderNumber, status, total, createdAt,
  items: { select: { productTitle, quantity, platform } }
}
```

This avoids fetching `payment` details, `shippingAddress`, and full `variant` joins for what is a list view. The full detail is only loaded when the user clicks an individual order.

## Admin Order Management

Admins can move orders through the lifecycle via `PATCH /api/admin/orders/[id]/status`. The endpoint:

1. Verifies the session contains `role: 'ADMIN'`
2. Validates the new status value with Zod
3. Calls `orderService.updateOrderStatus()` which enforces the transition rules
4. Returns the updated order or an error if the transition is invalid

Invalid transitions return a `400` with the message from the state machine:
```json
{ "error": "Invalid status transition from DELIVERED to PROCESSING. Allowed: REFUNDED" }
```

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders` | Customer | List authenticated user's orders |
| `GET` | `/api/orders/[id]` | Customer (owner) | Get order detail |
| `GET` | `/api/admin/orders` | Admin | List all orders with pagination |
| `PATCH` | `/api/admin/orders/[id]/status` | Admin | Transition order status |

## Order Confirmation

Confirmation email sent via Resend after successful payment.
