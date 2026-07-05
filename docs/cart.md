# Cart

## Design Principles

1. **Server-calculated totals** — the client never computes or submits a total. All prices are read from `ProductVariant.price` at calculation time.
2. **Persistent for authenticated users** — the cart row is created on first use and survives page refreshes, browser restarts, and device changes.
3. **Quantity capped to inventory** — adding more than available stock silently caps at the available quantity rather than returning an error.
4. **One cart per user** — enforced by `Cart.userId UNIQUE` in the schema.

## Data Flow

```
User adds item
      ↓
POST /api/cart
      ↓
Zod validates { variantId, quantity }
      ↓
cartService.addToCart(userId, variantId, quantity)
      ↓
cartRepository.addItem()
  → Fetch variant, check inventory > 0
  → getOrCreateCart(userId)
  → If item exists: update quantity (capped to inventory)
  → If new: create CartItem
      ↓
cartService.computeTotals(cart)
  → subtotal = Σ (variant.price × quantity)
  → calculateCartTotals(subtotal)
      ↓
Return CartWithTotals to client
```

## Total Calculation

```typescript
// src/lib/utils.ts
export function calculateCartTotals(subtotal: number) {
  const shippingCost = subtotal >= 100 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shippingCost + tax
  return { subtotal, shippingCost, tax, total }
}
```

Rules:
- Shipping is $9.99, free when subtotal ≥ $100
- Tax is 8% of subtotal
- Tax is applied before shipping is factored in
- Grand total = subtotal + shippingCost + tax

These totals are recomputed from scratch on every cart read. There is no stored `total` column on `Cart` — it would go stale if variant prices change.

## Inventory Capping

When adding an item that already exists in the cart:

```typescript
const currentQty = existingItem?.quantity ?? 0
const requestedQty = currentQty + quantity
const finalQty = Math.min(requestedQty, variant.inventory)
```

If the user has 3 of an item in their cart and tries to add 2 more, but only 4 are available, the cart quantity becomes 4, not 5. This is a UX choice — the alternative (returning a 409 error) is more disruptive.

## Upsert Logic

Adding a variant that already exists in the cart updates rather than creates. The `@@unique([cartId, variantId])` constraint on `CartItem` makes duplicate line items impossible at the database level, but the repository checks for an existing item before deciding whether to create or update.

```typescript
const existingItem = cart.items.find((item) => item.variant.id === variantId)

if (existingItem) {
  await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: finalQty } })
} else {
  await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity: finalQty } })
}
```

## Ownership Verification

Before updating or removing a cart item, the repository verifies the item belongs to the authenticated user's cart:

```typescript
const item = await prisma.cartItem.findUnique({
  where: { id: itemId },
  include: { cart: true },
})

if (!item || item.cart.userId !== userId) {
  throw new Error('Cart item not found')
}
```

This prevents user A from modifying user B's cart by guessing item IDs.

## Client-Side Hook

`useCart` (`src/hooks/useCart.ts`) is the client-side interface for cart operations. It:
- Fetches the cart from `/api/cart` when the session is available
- Exposes `addToCart`, `updateItem`, `removeItem`, `refetch`, and `itemCount`
- Re-fetches the full cart after every mutation to keep totals accurate

```typescript
const { cart, loading, addToCart, itemCount } = useCart()
```

The hook is used in:
- `Navbar` — displays the live item count badge
- `AddToCartSection` — the add-to-cart button on product detail pages
- `cart/page.tsx` — the cart page itself

## Cart Clearing

On successful checkout, the cart is cleared by deleting all `CartItem` rows:

```typescript
await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
```

The `Cart` row itself is retained — it will be reused for the user's next shopping session.

## API Reference

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| `GET` | `/api/cart` | Required | — | Fetch cart with computed totals |
| `POST` | `/api/cart` | Required | `{ variantId, quantity }` | Add item to cart |
| `PATCH` | `/api/cart/[itemId]` | Required | `{ quantity }` | Update item quantity |
| `DELETE` | `/api/cart/[itemId]` | Required | — | Remove item from cart |

## Cart

Cart stored in DB per user session. Survives browser restarts.

## Reservation TTL

Inventory reserved 15 min during checkout. Auto-released on expiry.

## Bug Report

Cart cleared on refresh for users with strict cookie settings.

## Fix

Cookie set with `SameSite=Lax; Secure` for cross-page persistence.
