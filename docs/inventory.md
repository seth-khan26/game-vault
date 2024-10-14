# Inventory

## Design

Inventory belongs to the **variant/SKU**, not the logical product. Each platform version of a game has its own independent stock count:

```
Spider-Man: Miles Morales
  PS4 SKU (GV-SMM-PS4): inventory = 75
  PS5 SKU (GV-SMM-PS5): inventory = 120
```

This reflects reality — a retailer can be out of stock on the PS4 version while having plenty of PS5 copies.

## Deduction at Purchase

Inventory is decremented inside the order creation transaction:

```typescript
await tx.productVariant.update({
  where: { id: item.variantId },
  data: { inventory: { decrement: item.quantity } },
})
```

`{ decrement: N }` is a Prisma atomic operation that maps to `SET inventory = inventory - N` in SQL. Combined with the inventory check inside the same transaction, this prevents the count from going negative under concurrent load.

The check-then-decrement pattern inside the transaction:

```sql
-- Conceptual equivalent
UPDATE "ProductVariant"
SET inventory = inventory - requested_qty
WHERE id = variant_id
  AND inventory >= requested_qty
```

If the `WHERE` clause matches zero rows (another transaction already took the last unit), Prisma throws and the transaction rolls back.

## Admin Inventory Adjustment

Admins can set inventory to any non-negative value directly:

```typescript
// inventoryService.adjustInventory
if (inventory < 0) throw new Error('Inventory cannot be negative')

const variant = await inventoryRepository.getVariantById(variantId)
if (!variant) throw new Error(`Variant ${variantId} not found`)

return inventoryRepository.setInventory(variantId, inventory)
```

This is a **set** operation (absolute value), not a delta. The admin UI shows the current count and the admin types the new value. This avoids off-by-one errors from thinking "add 50" when the current count is 23.

## Low-Stock Detection

```typescript
export async function getLowStockVariants(threshold = 5) {
  return prisma.productVariant.findMany({
    where: { inventory: { lte: threshold } },
    orderBy: { inventory: 'asc' },  // worst stock first
  })
}
```

The default threshold is 5 units. The admin dashboard shows the count of low-stock items as a stat card. The admin inventory page highlights rows where inventory is below threshold in red.

## Availability Display in Catalog

Product cards and detail pages show availability based on the selected variant's inventory:

- `inventory > 0` → "In Stock"
- `inventory === 0` → "Out of Stock" (Add to Cart button disabled)

The threshold for "In Stock" display is > 0, not the admin low-stock threshold of 5. A customer sees "In Stock" even if there's only 1 unit left.

## Cart Inventory Capping

When a customer adds items to their cart, the quantity is silently capped to the available inventory:

```typescript
const finalQty = Math.min(requestedQty, variant.inventory)
```

This means the cart always reflects an achievable purchase — the customer cannot have more items in their cart than actually exist in stock. If inventory drops between when an item was added to cart and when checkout begins, the checkout service's pre-validation step will catch this and surface a clear error.

## API Reference

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/inventory` | Admin | — | List all variants with stock levels |
| `PATCH` | `/api/admin/inventory` | Admin | `{ variantId, inventory }` | Set inventory for a variant |
