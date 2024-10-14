# Engineering Decisions

A log of non-obvious choices made during implementation and the reasoning behind them.

---

## Modular Monolith Over Microservices

**Decision:** Single Next.js application with bounded modules in `src/modules/`.

**Why:** The spec explicitly rules out microservices for the MVP. A modular monolith delivers clean separation of concerns — each module owns its types, service, and repository — without the operational burden of distributed systems (service discovery, inter-service auth, network partitioning, distributed tracing). The module boundaries are defined precisely enough that extracting a service later is straightforward if traffic demands it.

---

## Server-Side Cart Totals

**Decision:** Cart totals (subtotal, shipping, tax, grand total) are computed on every `GET /api/cart` response from the current state of `ProductVariant.price`. They are never stored in the `Cart` table or sent by the client.

**Why:** Prices change. If a product's price drops and a customer has it in their cart, the cart should reflect the new price. Storing a cached total would require invalidation logic. Computing from current prices on read is simpler and always correct. The performance cost is negligible — it is in-memory arithmetic on a small set of floats.

---

## OrderItem Denormalization

**Decision:** `OrderItem` stores `productTitle`, `platform`, `sku`, and `unitPrice` as columns, duplicating data from `Product` and `ProductVariant`.

**Why:** Order history must be immutable. If a product is renamed, its price changes, or it is archived, past orders must still display correctly. Without this snapshot, displaying the receipt for an old order would require reading the current product state — which may no longer match what was purchased. This pattern ("event sourcing lite") is the standard approach for financial records.

The `variantId` foreign key is retained for analytics but is explicitly not relied on for receipt display.

---

## Decimal Instead of Float for Money

**Decision:** All monetary columns use `Decimal @db.Decimal(10, 2)` in Prisma.

**Why:** IEEE 754 floating-point arithmetic cannot represent all base-10 fractions exactly. `0.1 + 0.2 === 0.30000000000000004` in JavaScript. For a single transaction this rounding error is invisible, but accumulated across a revenue report it introduces real errors. PostgreSQL's `NUMERIC(10,2)` stores the exact decimal value. When pulling into JavaScript for arithmetic, `Number()` is used only for intermediate calculations, and final values are stored back through Prisma which preserves precision.

---

## Inventory Check Inside Transaction (Double-Check Pattern)

**Decision:** Inventory is checked twice during checkout — once before the transaction starts, and once inside the `$transaction` callback.

**Why:** The pre-transaction check provides fast, clear error messages before any database write. The in-transaction check is the actual safety guarantee. Without the inner check, two concurrent checkouts could both pass the pre-check (both see `inventory = 1`) and then both decrement, resulting in `inventory = -1`. The transaction serializes the two decrements, and the second transaction sees the updated value from the first. The `{ decrement: N }` Prisma operation maps to an atomic `UPDATE ... SET inventory = inventory - N WHERE inventory >= N` equivalent, which cannot produce a negative result because of the check inside the transaction.

---

## Cart Quantity Capping (Silent vs Error)

**Decision:** Adding more quantity than inventory allows silently caps at the available inventory, rather than returning a validation error.

**Why:** A 409 error when adding to cart is disruptive. The customer wanted to add the item; capping means they get as many as possible. The cart displays the actual quantity, so the customer sees what happened. If inventory drops between cart addition and checkout, the checkout service surfaces a clear error at that point.

---

## URL Parameters for All Catalog State

**Decision:** All catalog filters, sort, and page are represented in the URL as query parameters.

**Why:** Catalog pages with filters are the primary shareable and bookmarkable URLs in the app. `/games?platform=ps5&genre=rpg&sort=price_asc` can be shared, bookmarked, linked to from marketing emails, and indexed by search engines. Client-side state (useState) would break all of these. Next.js Server Components read `searchParams` directly, eliminating the need for client-side state management for the catalog entirely.

---

## In-Memory Price Sort

**Decision:** Price sorting is done in JavaScript after fetching the page of results from the database, not via an `ORDER BY` clause.

**Why:** Prisma cannot `ORDER BY` an aggregated value across a related table in a single query. The minimum variant price for a product is not a column on `Product` — it requires reading across `ProductVariant`. For a page size of 12, sorting 12 objects in memory is negligible. The practical fix for large catalogs is a denormalized `minPrice` column on `Product`, updated by a trigger or application-level hook when variants change.

---

## Soft Delete (Archive) for Products

**Decision:** Products are never hard-deleted. They transition to `status: 'ARCHIVED'`.

**Why:** `OrderItem.variantId` references `ProductVariant`, which references `Product`. Hard-deleting a product would cascade-delete variants and break the foreign key from `OrderItem`. Even with cascading deletes, order history would reference rows that no longer exist. Archiving preserves referential integrity and allows admins to reverse the decision.

---

## NextAuth JWT Strategy (Stateless Sessions)

**Decision:** Sessions use the JWT strategy, not the database strategy.

**Why:** The database strategy requires a `Session` table and a lookup on every authenticated request. The JWT strategy encodes the session data (user ID, role) directly in a signed cookie — no database round-trip needed to validate who the user is. The trade-off is that changes to a user's role take up to the token expiry time (30 days) to propagate. For an MVP this is acceptable. If immediate role revocation were required, the database strategy or a token blocklist would be necessary.

---

## Parallel Dashboard Queries

**Decision:** The six dashboard stat queries run in `Promise.all()`.

**Why:** Each query is independent. Running them sequentially would add the latency of each query in series (~50ms each × 6 = ~300ms). Running in parallel means the response time is determined by the slowest single query (~50ms). This is a general principle: any set of independent I/O operations should be parallelized.

---

## `force-dynamic` on API Routes

**Decision:** All API route handlers that call `getServerSession()` export `export const dynamic = 'force-dynamic'`.

**Why:** Next.js 14 attempts to statically prerender API routes at build time if it can determine they have no dynamic dependencies. `getServerSession()` reads HTTP headers (the cookie), which is a dynamic operation — but Next.js cannot always infer this. Without `force-dynamic`, the build fails with "Route couldn't be rendered statically because it used headers." The export is an explicit opt-out of static rendering for these routes.

---

## Password Hashing Cost Factor 12

**Decision:** bcrypt is used with cost factor 12 (not the library default of 10).

**Why:** bcrypt's cost factor is exponential — factor 12 is 4× slower than factor 10. On modern hardware, factor 12 takes ~250ms per hash. This makes brute-force attacks expensive while being imperceptible to users (login is a one-time operation per session). OWASP recommends cost factor ≥ 10 for bcrypt; 12 is a reasonable margin above that for a 2024 deployment.
