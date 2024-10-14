# API Reference

## Conventions

### Authentication

All non-public endpoints require a valid NextAuth session cookie. The session is validated by calling `getServerSession(authOptions)` inside each route handler.

| Response | Meaning |
|---|---|
| `401 Unauthorized` | No session (not logged in) |
| `403 Forbidden` | Session exists but role is insufficient (e.g., customer hitting admin endpoint) |

### Request Format

All `POST` and `PATCH` endpoints expect `Content-Type: application/json`.

### Response Format

**Success**: the relevant entity or collection as JSON.

**Validation error** (400):
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": { "email": ["Invalid email address"] },
    "formErrors": []
  }
}
```

**Domain error** (4xx):
```json
{ "error": "Insufficient inventory for God of War Ragnarök (PS5). Requested: 3, Available: 1" }
```

**Server error** (500):
```json
{ "error": "Failed to fetch cart" }
```

500 responses never expose internal details — the raw error is logged server-side only.

### Dynamic Segments

`export const dynamic = 'force-dynamic'` is set on all route handlers that call `getServerSession()`. This prevents Next.js from attempting to pre-render them at build time.

---

## Public Routes

### Auth

#### `POST /api/auth/register`

Register a new customer account.

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass1!",
  "confirmPassword": "SecurePass1!"
}
```

**Response (201):**
```json
{
  "id": "cuid",
  "email": "jane@example.com",
  "name": "Jane Smith",
  "role": "CUSTOMER",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Errors:** `409` if email already registered.

#### `POST /api/auth/callback/credentials`

Handled by NextAuth. Accepts `email` and `password` form fields. On success, sets session cookie and redirects.

---

## Customer Routes

All require authentication. User identity is always read from the session — not from the request body.

### Cart

#### `GET /api/cart`

Returns the authenticated user's cart with computed totals.

**Response (200):**
```json
{
  "id": "cuid",
  "userId": "cuid",
  "items": [
    {
      "id": "cuid",
      "quantity": 2,
      "variant": {
        "id": "cuid",
        "platform": "PS5",
        "sku": "GV-SMM-PS5",
        "price": "49.99",
        "inventory": 118,
        "product": {
          "title": "Spider-Man: Miles Morales",
          "slug": "spider-man-miles-morales",
          "images": [{ "url": "...", "alt": "...", "isPrimary": true }]
        }
      }
    }
  ],
  "totals": {
    "subtotal": 99.98,
    "shippingCost": 9.99,
    "tax": 8.00,
    "total": 117.97,
    "itemCount": 2
  }
}
```

#### `POST /api/cart`

Add an item to the cart. Quantity is capped to available inventory.

**Body:** `{ "variantId": "cuid", "quantity": 1 }`

**Response (201):** Full cart object (same as GET).

**Errors:** `404` variant not found, `409` out of stock.

#### `PATCH /api/cart/[itemId]`

Update quantity of a specific cart item.

**Body:** `{ "quantity": 3 }`

**Response (200):** Full cart object.

#### `DELETE /api/cart/[itemId]`

Remove an item from the cart.

**Response (200):** Full cart object.

---

### Checkout

#### `POST /api/checkout`

Convert the current cart to an order and process payment. The client submits only the shipping address — items, prices, and totals are derived server-side.

**Body:**
```json
{
  "shippingAddress": {
    "line1": "123 Main St",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "saveAddress": true
}
```

**Response (201):**
```json
{
  "success": true,
  "order": { "id": "cuid", "orderNumber": "GV-LHMBHKW8-4BX7", "status": "PAID", ... },
  "paymentStatus": "COMPLETED"
}
```

**Errors:**
- `400` cart is empty or validation failed
- `402` payment processing failed (order created but payment declined)
- `409` insufficient inventory

---

### Orders

#### `GET /api/orders`

List the authenticated user's orders, most recent first.

**Response (200):**
```json
{
  "orders": [
    {
      "id": "cuid",
      "orderNumber": "GV-LHMBHKW8-4BX7",
      "status": "DELIVERED",
      "total": "117.97",
      "createdAt": "2024-01-15T10:00:00Z",
      "items": [{ "productTitle": "Spider-Man: Miles Morales", "quantity": 2, "platform": "PS5" }]
    }
  ]
}
```

#### `GET /api/orders/[id]`

Get full detail for a single order. Returns `403` if the order belongs to a different user.

---

## Admin Routes

All require `role: 'ADMIN'`. Return `403` for authenticated non-admin users.

### Dashboard

#### `GET /api/admin/dashboard`

Returns aggregate stats for the dashboard.

**Response (200):**
```json
{
  "totalRevenue": 48291.50,
  "totalOrders": 412,
  "totalProducts": 20,
  "totalCustomers": 87,
  "lowStockCount": 3,
  "recentOrders": [...],
  "revenueByMonth": [
    { "month": "Mar 2024", "revenue": 8200.50 },
    ...
  ]
}
```

### Products

#### `GET /api/admin/products`

**Query params:** `page`, `limit`, `status` (ACTIVE | ARCHIVED)

#### `POST /api/admin/products`

Create a new product with variants. See `productSchema` in `src/lib/validations.ts` for full body shape.

#### `GET /api/admin/products/[id]`

Get single product with all relations.

#### `PATCH /api/admin/products/[id]`

Partial update. Only provided fields are modified.

### Orders

#### `GET /api/admin/orders`

**Query params:** `page`, `limit`, `status`

#### `PATCH /api/admin/orders/[id]/status`

**Body:** `{ "status": "SHIPPED" }`

**Errors:** `400` if the transition is invalid for the current status.

### Inventory

#### `GET /api/admin/inventory`

List all variants ordered by product title.

#### `PATCH /api/admin/inventory`

**Body:** `{ "variantId": "cuid", "inventory": 50 }`

Sets inventory to the given absolute value.

### Customers

#### `GET /api/admin/customers`

List all customer accounts with order stats.
