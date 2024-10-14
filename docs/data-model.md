# Data Model

## Entity Overview

```
User ──────────── Address[]
  │
  ├── Cart ────── CartItem[] ─── ProductVariant
  │
  └── Order[] ─── OrderItem[] ── ProductVariant
                  ShippingAddress (denormalized)
                  Payment ─── PaymentEvent[]

Product ─────────── ProductImage[]
  │               Genre[] (M2M)
  └── ProductVariant[]
        platform (PS4 | PS5)
        sku (unique)
        price
        inventory
```

## Entities

### User

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash, cost factor 12
  role      Role     @default(CUSTOMER)
}
```

`role` is a database-level enum (`CUSTOMER | ADMIN`). It is never read from user input — only from the authenticated session, which is derived from the JWT token generated at login time.

### Product / ProductVariant

A `Product` is the logical game title. A `ProductVariant` is the purchasable unit for a specific platform.

```
Product: "Spider-Man: Miles Morales"
  └── Variant: PS4, SKU: GV-SMM-PS4, price: $39.99, inventory: 75
  └── Variant: PS5, SKU: GV-SMM-PS5, price: $49.99, inventory: 120
```

This structure means:
- Product information (title, description, developer, genres) is stored once
- Platform-specific data (price, inventory, SKU) is per-variant
- A PS5-only title has one variant; a cross-gen title has two

`ProductVariant.sku` is globally unique. It serves as the stable identifier for order history — product titles and prices can change, SKUs do not.

### Cart / CartItem

```prisma
model Cart {
  userId String @unique   // one cart per user
}

model CartItem {
  cartId    String
  variantId String
  quantity  Int
  @@unique([cartId, variantId])  // prevents duplicate line items
}
```

The `@@unique([cartId, variantId])` constraint means adding an already-carted variant always goes through the update path rather than creating a duplicate row. The repository handles this by checking for an existing item and updating its quantity.

**Cart does not store price.** Price is always read from `ProductVariant.price` at checkout time. Storing price in the cart would allow a stale price to persist if a variant's price changes between adding to cart and checkout.

### Order / OrderItem

```prisma
model OrderItem {
  productTitle String    // snapshot at purchase time
  platform     Platform  // snapshot
  sku          String    // snapshot
  unitPrice    Decimal   // snapshot — never changes
  quantity     Int
  totalPrice   Decimal
  variantId    String    // FK still exists for analytics
}
```

**OrderItem snapshots are the most important design decision in the data model.**

The `variantId` foreign key is kept for analytics queries, but all fields needed to display an order receipt are denormalized directly into `OrderItem`. This means:
- Order history is correct even if a product is archived or its price changes
- Historical revenue calculations are accurate
- Reconstructing an invoice does not depend on the current state of the `Product` table

### Payment / PaymentEvent

```prisma
model Payment {
  orderId         String        @unique  // 1:1 with Order
  provider        String                  // "mock" or "stripe" etc.
  providerOrderId String?                 // provider's external reference
  status          PaymentStatus
}

model PaymentEvent {
  providerEventId String @unique  // idempotency key
  event           String          // "payment.captured", "payment.refunded"
}
```

`PaymentEvent.providerEventId` being unique is the idempotency guarantee. Payment providers retry webhooks on failure. Before processing any webhook event, the system checks whether `providerEventId` already exists. If it does, it returns 200 without reprocessing. This prevents double-charging.

Card numbers, CVVs, and raw payment credentials are never stored.

## Constraints and Why They Matter

| Constraint | Reason |
|---|---|
| `User.email UNIQUE` | Prevents duplicate accounts; used as the lookup key at login |
| `ProductVariant.sku UNIQUE` | SKUs are business identifiers; duplicates would break order history |
| `Order.orderNumber UNIQUE` | Customer-facing reference; generated as `GV-{timestamp}-{random}` |
| `Cart.userId UNIQUE` | One cart per user enforced at the database level |
| `CartItem UNIQUE(cartId, variantId)` | Prevents duplicate line items; upsert logic relies on this |
| `PaymentEvent.providerEventId UNIQUE` | Webhook idempotency — prevents double processing |
| `OrderItem.orderId INDEX` | Efficient order detail fetches |
| `Order.userId INDEX` | Efficient order history queries per user |
| `Order.status INDEX` | Admin order filtering by status |
| `ProductVariant.platform INDEX` | Catalog filter by PS4/PS5 |
| `ProductVariant.sku INDEX` | SKU lookups |
| `ProductVariant.price INDEX` | Price range filtering |

## Decimal Types

All monetary values use `Decimal @db.Decimal(10, 2)` — not `Float`. Floating-point types cannot represent all decimal fractions exactly, which causes rounding errors when accumulating totals. PostgreSQL's `NUMERIC(10, 2)` stores values exactly.

When moving Decimal values to JavaScript arithmetic, always call `Number()`:
```typescript
const subtotal = items.reduce((sum, item) =>
  sum + Number(item.variant.price) * item.quantity, 0
)
```

## Enums

```prisma
enum Role          { CUSTOMER, ADMIN }
enum Platform      { PS4, PS5 }
enum ProductStatus { ACTIVE, ARCHIVED }
enum OrderStatus   { PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED }
enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED }
```

Enums are defined in the database schema, not just in TypeScript. This means invalid values are rejected at the database level, not just at the application level.

## Soft Delete vs Archive

Products are never hard-deleted. They are set to `status: ARCHIVED`. This preserves referential integrity — `OrderItem.variantId` still points to a valid `ProductVariant` even after a product is taken off sale. Hard deletion would break order history.
