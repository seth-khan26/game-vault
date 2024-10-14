# Admin

## Access Control

Every admin page and API route enforces two layers of protection:

**Page layer** — `src/app/admin/layout.tsx` checks the server-side session and redirects non-admins:

```typescript
const session = await getServerSession(authOptions)
if (!session?.user || session.user.role !== 'ADMIN') {
  redirect('/login')
}
```

**API layer** — every admin route handler calls `requireAdmin()`:

```typescript
function requireAdmin(session: Session | null) {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}
```

Both guards must be present. The page guard only prevents the UI from rendering — it does not protect the API from direct curl requests.

## Dashboard Stats

`getDashboardStats()` runs six queries in parallel:

```typescript
const [
  totalOrdersResult,   // aggregate: count + sum of non-cancelled/refunded orders
  totalProducts,       // count of ACTIVE products
  totalCustomers,      // count of CUSTOMER role users
  lowStockCount,       // count of variants with inventory ≤ 5
  recentOrders,        // last 5 orders with user info
  revenueByMonth,      // raw SQL: revenue grouped by month, last 6 months
] = await Promise.all([...])
```

The revenue-by-month query uses raw SQL because Prisma's `groupBy` does not support date truncation:

```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
  COALESCE(SUM(total), 0)::float as revenue
FROM "Order"
WHERE status NOT IN ('CANCELLED', 'REFUNDED')
  AND "createdAt" >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', "createdAt")
ORDER BY DATE_TRUNC('month', "createdAt") ASC
```

`CANCELLED` and `REFUNDED` orders are excluded from revenue figures because no money was retained.

## Product Management

### Product Form

`ProductForm.tsx` handles both creation and editing. It uses React Hook Form with a Zod resolver for client-side validation before submission.

The form structure:
- **Basic info** — title, slug (auto-generated from title via `slugify`), description, developer, publisher, release date, featured toggle
- **Genres** — multi-select checkboxes
- **Images** — URL inputs with alt text, one marked as primary
- **Variants** — PS4 and PS5 sections, each with price and inventory

Slug auto-generation: the slug field updates automatically as the title changes, but can be manually overridden:

```typescript
watch('title')  // subscribe to title changes
setValue('slug', slugify(titleValue))  // auto-update slug
```

### Create Product

```
POST /api/admin/products
  → requireAdmin()
  → Zod productSchema validation
  → adminService.createProduct(input)
    → prisma.product.create({
        data: {
          ...basicInfo,
          genres: { connect: genreIds.map(id => ({ id })) },
          images: { create: [...] },
          variants: { create: [...] },
        }
      })
```

### Update Product

```
PATCH /api/admin/products/[id]
  → requireAdmin()
  → adminService.updateProduct(id, input)
    → Build partial updateData object
    → If images changed: deleteMany old images, create new ones
    → If variants changed: upsert each by platform
```

The update operation uses partial application — only fields present in the request body are updated. This prevents an edit to the title from accidentally clearing other fields.

For variants, the update upserts by `(productId, platform)`:

```typescript
await prisma.productVariant.upsert({
  where: { productId_platform: { productId: id, platform: v.platform } },
  update: { price: v.price, inventory: v.inventory, sku: v.sku },
  create: { productId: id, ...v },
})
```

### Archive Product

Products are archived rather than deleted. The `ArchiveButton` component sends a `PATCH` to set `status: 'ARCHIVED'`. The product disappears from the customer catalog (all catalog queries filter `status: 'ACTIVE'`) but remains in the database for order history integrity.

## Order Management

Admins can view all orders and advance their status. The order list page shows:
- Order number, customer name/email, status badge, total, creation date
- Items preview (e.g., "Spider-Man: Miles Morales × 1 [PS5]")

Status updates go through the same state machine as all other status transitions. Invalid transitions are rejected with a descriptive error.

## Inventory Management

The inventory page lists all variants ordered by product title then platform. Variants with stock ≤ 5 are highlighted in red.

Inline adjustment: each row has a numeric input and a save button. Submitting calls `PATCH /api/admin/inventory` with `{ variantId, inventory }`. The new value is an absolute count, not a delta.

## Customer Visibility

The customers page shows all users with `role: 'CUSTOMER'`. It displays name, email, join date, order count, and total spent. This is a read-only view — admins cannot edit customer accounts from this panel.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Dashboard stats |
| `GET` | `/api/admin/products` | Product list with pagination |
| `POST` | `/api/admin/products` | Create product |
| `GET` | `/api/admin/products/[id]` | Get single product |
| `PATCH` | `/api/admin/products/[id]` | Update product |
| `GET` | `/api/admin/orders` | Order list with pagination |
| `PATCH` | `/api/admin/orders/[id]/status` | Update order status |
| `GET` | `/api/admin/inventory` | All variants with stock |
| `PATCH` | `/api/admin/inventory` | Set variant inventory |
| `GET` | `/api/admin/customers` | Customer list |
