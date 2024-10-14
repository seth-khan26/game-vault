# GameVault

A curated PS4 / PS5 game store built as a senior-level full-stack MVP. Each game title is a logical product; PS4 and PS5 editions are separate purchasable variants with independent pricing, SKUs, and inventory. The store includes a full AI-powered game advisor backed by a semantic RAG pipeline.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui-style primitives (Button, Input, Badge, Card, Dialog, Toast, Table) |
| Auth | NextAuth.js v4 — credentials provider, JWT session strategy |
| ORM | Prisma |
| Database | PostgreSQL + pgvector |
| Validation | Zod (shared between client and server) |
| Forms | React Hook Form + Zod resolver |
| Password hashing | bcryptjs (cost factor 12) |
| LLM | Llama 3.3 70B Instruct via HuggingFace router (OpenAI-compatible) |
| Embeddings | BAAI/bge-small-en-v1.5 — 384-dim vectors via HuggingFace inference |
| Vector search | pgvector cosine similarity (`<=>` operator) |

## Features

### Customer Store

**Catalog & Discovery**
- Browse all PS4/PS5 games with server-rendered, paginated results
- Filter by platform, genre, price range, release year, and stock availability
- Sort by newest, price ascending/descending, and popularity (by units sold)
- URL-driven filters — all state lives in query parameters, pages are bookmarkable and shareable
- Featured games section and new releases on the homepage

**AI Game Advisor (RAG-powered)**
- Floating chat widget available on every store page
- Understands natural language queries: "something like Elden Ring", "scary PS5 game under $50", "best RPG on PS4"
- Semantic vector search retrieves the most relevant games from the catalog as context
- Llama 3.3 70B generates personalised recommendations with prices, platform details, and low-stock urgency signals
- For logged-in users, order history is included in the LLM context for tailored suggestions
- Responses stream token-by-token; suggestion chips on first open guide new users

**Cart**
- Persistent cart stored in the database — survives page refreshes and sessions
- Duplicate variant prevention (`UNIQUE(cartId, variantId)`)
- Server-calculated totals on every request; the client never submits a price
- Shipping: $9.99 flat, free for orders ≥ $100
- Tax: 8% applied to subtotal

**Checkout & Orders**
- Single-page checkout with shipping address form (Zod-validated)
- Atomic inventory deduction inside a Prisma transaction — concurrent checkouts cannot oversell
- OrderItem snapshots `productTitle`, `platform`, `sku`, and `unitPrice` at purchase time
- Full order history with per-order detail pages
- Order status tracking: `PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED`

**Auth**
- Email + password registration with bcrypt hashing
- JWT session with role claim (`CUSTOMER` / `ADMIN`)
- Protected routes redirect unauthenticated users to login

### Admin Panel

- **Dashboard** — total revenue, order count, customer count, low-stock alerts
- **Products** — create, edit, archive products and variants; set featured flag
- **Orders** — view all orders, advance status through the state machine
- **Inventory** — adjust stock levels with an audit trail
- **Customers** — list all registered customers with order summaries
- RBAC enforced at both the page level (layout redirect) and API level (`requireAdmin()` guard)

## Setup

**Prerequisites:** Node.js 18+, PostgreSQL 14+ with pgvector extension, HuggingFace API key

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — see Environment Variables below

# Apply database schema and enable pgvector
npx prisma migrate deploy

# Seed 20 games + demo accounts
npx prisma db seed

# Generate product embeddings for the AI advisor
npm run seed:embeddings

# Start dev server
npm run dev
```

App runs at `http://localhost:3000`.

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gamevault"

# Auth
NEXTAUTH_SECRET="your-secret-here"   # generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# LLM — OpenAI-compatible endpoint (HuggingFace router)
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://router.huggingface.co/v1
LLM_MODEL=meta-llama/Llama-3.3-70B-Instruct
LLM_API_KEY=hf_your_key_here

# Embeddings — HuggingFace inference (384-dim bge-small-en-v1.5)
EMBEDDING_PROVIDER=huggingface
EMBEDDING_BASE_URL=https://router.huggingface.co/hf-inference
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
EMBEDDING_API_KEY=hf_your_key_here
EMBEDDING_DIMENSIONS=384
```

### Docker (optional PostgreSQL)

```bash
docker-compose up -d   # starts postgres on port 5432
```

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@gamevault.com | Admin123! |
| Customer | john@example.com | Customer123! |

## Implementation

### Architecture

Modular monolith. Business logic lives in `src/modules/`, never in React components. Each module owns its service, repository, and types:

```
src/modules/
  auth/       registration, login, user profile
  catalog/    products, variants, genres, search, filtering
  cart/       persistent cart, server-side totals
  checkout/   orchestrates cart → order → payment
  orders/     order creation, lifecycle, status transitions
  inventory/  stock tracking, admin adjustments
  payments/   provider abstraction (mock / Stripe-ready)
  admin/      dashboard stats, product & order management
  ai/         embedding client, pgvector retrieval, LLM streaming, seed script
```

Every request goes through the same layer stack:

```
Route Handler → Zod Validation → Service → Repository → Prisma → PostgreSQL
```

### AI / RAG Pipeline

```
User query
  ↓ embed (BAAI/bge-small-en-v1.5, 384-dim, HuggingFace inference)
  ↓ cosine similarity search (pgvector <=> operator, top-6 games)
  ↓ enrich with genres + variant prices from Prisma
  ↓ build system prompt (catalog context + optional order history)
  ↓ stream from Llama 3.3 70B (OpenAI-compatible SSE)
  ↓ re-stream to client as data: {"content":"..."} SSE
  → ChatWidget renders tokens as they arrive
```

**Embedding documents.** Each product is embedded as a rich text document combining title, genre tags, description, developer, publisher, and platform/price details. This lets semantic queries like "open-world samurai" match Ghost of Tsushima even though neither word appears in the description verbatim.

**Retrieval.** `$queryRawUnsafe` executes a single SQL join across `ProductEmbedding` and `Product` using the `<=>` cosine distance operator. Distance is converted to similarity (`1 - distance`) for display purposes; results are ordered by distance so the closest match is always first.

**Personalisation.** When a session is present, the 5 most recent fulfilled orders are fetched and appended to the system prompt as a "previously purchased" list. The LLM uses this to avoid recommending games the customer already owns and to infer genre preferences.

**Streaming.** The API route (`POST /api/ai/chat`) reads SSE chunks from the LLM, extracts `choices[0].delta.content`, and re-emits each token as a custom SSE event to the browser. The `ChatWidget` appends tokens directly to the last assistant message in state, producing a live-typing effect.

**Re-embedding.** Run `npm run seed:embeddings` after adding new products to the catalog. The script upserts on conflict so existing embeddings are refreshed in place.

### Key Design Decisions

**Server-calculated totals.** Cart subtotal, shipping, and tax are computed from `ProductVariant.price` on every request. The client never submits a total.

**OrderItem snapshots.** `productTitle`, `platform`, `sku`, and `unitPrice` are copied into `OrderItem` at purchase time. Order history stays accurate even after products are renamed, repriced, or archived.

**Atomic inventory deduction.** Order creation and inventory decrement run inside a single `prisma.$transaction`. The inventory is re-verified inside the transaction, so two concurrent checkouts cannot both succeed when only one unit remains.

**Order state machine.** Transitions are defined as an explicit map and enforced in the repository. Invalid transitions throw before any write:

```
PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED
                ↘ CANCELLED       ↘ REFUNDED (from PAID or DELIVERED)
```

**Payment abstraction.** `PaymentProvider` is an interface. `MockPaymentProvider` is active in development (always succeeds, 50ms simulated delay). Swapping to Stripe requires implementing the interface and changing one import — no other files change.

**Idempotent payment events.** `PaymentEvent.providerEventId` is unique. Webhook retries from payment providers are detected and ignored before any reprocessing occurs.

**RBAC at two layers.** Admin pages check the session in the layout and redirect. Admin API routes independently call `requireAdmin()`. A compromised page cannot bypass the API guard.

**URL-driven catalog.** All filters, sort order, and page number are query parameters (`/games?platform=ps5&genre=rpg&sort=price_asc`). Pages are bookmarkable, shareable, and server-rendered without client state.

**No float money.** All monetary columns are `NUMERIC(10,2)` in PostgreSQL and `Decimal` in Prisma — never `FLOAT` — to avoid floating-point rounding errors in financial calculations.

**pgvector over a separate vector store.** Embeddings live in the same PostgreSQL instance as the rest of the data. No additional service to deploy or keep in sync. At catalog scale (20–10,000 products) exact nearest-neighbour search on a flat table is fast; an IVFFlat or HNSW index can be added later without any application code changes.

### Data Model (abbreviated)

```
User            — email (unique), bcrypt password, role (CUSTOMER | ADMIN)
Product         — title, slug (unique), description, developer, publisher, genres (M2M)
ProductVariant  — product, platform (PS4 | PS5), sku (unique), price (Decimal), inventory
ProductEmbedding — productId (PK → Product), embedding vector(384), updatedAt
Cart / CartItem — one cart per user; UNIQUE(cartId, variantId) prevents duplicates
Order / OrderItem — snapshots productTitle, platform, sku, unitPrice at purchase time
Payment / PaymentEvent — provider reference, status, idempotency key per event
```

### Project Structure

```
src/
  app/
    (store)/      customer pages (home, catalog, product, cart, checkout, orders, profile)
    (auth)/       login, register
    admin/        dashboard, products, orders, inventory, customers
    api/          route handlers (cart, checkout, orders, auth, admin/*, ai/chat)
  modules/
    auth/         service + types
    catalog/      repository + service + types
    cart/         repository + service + types
    checkout/     service + types
    orders/       repository + service + types
    inventory/    repository + service + types
    payments/     mock-provider + service + types
    admin/        service + types
    ai/           embedding.ts, retrieval.ts, chat.ts, types.ts, seed-embeddings.ts
  components/
    ui/           Button, Input, Badge, Card, Dialog, Toast, Table, etc.
    shared/       Navbar, Footer, GameCard, ChatWidget, CatalogFilters, etc.
  hooks/          useCart (client-side cart state)
  lib/
    prisma.ts     singleton Prisma client
    auth.ts       NextAuth config (JWT strategy, role in token)
    utils.ts      formatPrice, calculateCartTotals, generateOrderNumber, slugify
    validations.ts Zod schemas shared across client and server
prisma/
  schema.prisma
  seed.ts           20 games across PS4/PS5 with realistic data
  migrations/
    20260818140946_init/          full schema
    20260820000000_add_pgvector/  pgvector extension + ProductEmbedding table
docs/               full implementation documentation per subsystem
```

## Commands

```bash
npm run dev                   # development server (localhost:3000)
npm run build                 # production build
npm run seed:embeddings       # embed all active products into pgvector

npx tsc --noEmit              # type check
npx prisma studio             # database browser UI
npx prisma db seed            # re-seed games + users (idempotent)
npx prisma migrate deploy     # apply pending migrations
npx prisma migrate reset      # drop, migrate, seed (destructive)
```

## Docs

Detailed documentation for each subsystem is in [`docs/`](./docs/README.md):

- [Architecture](./docs/architecture.md)
- [Data Model](./docs/data-model.md)
- [Auth & RBAC](./docs/auth.md)
- [Catalog & Search](./docs/catalog.md)
- [Cart](./docs/cart.md)
- [Checkout](./docs/checkout.md)
- [Orders](./docs/orders.md)
- [Inventory](./docs/inventory.md)
- [Payments](./docs/payments.md)
- [Admin](./docs/admin.md)
- [AI Advisor & RAG](./docs/ai.md)
- [API Reference](./docs/api.md)
- [Engineering Decisions](./docs/decisions.md)
