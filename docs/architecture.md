# Architecture

## Design Philosophy

GameVault is a **modular monolith** — a single deployable unit where the internal code is organized into explicit, bounded modules with clear responsibilities. This is the right architecture for an MVP that needs to be production-quality without the operational complexity of distributed services.

The key constraint from the spec: business rules must never live inside React components. All domain logic runs server-side through a layered stack.

## Layer Stack

```
HTTP (Next.js Route Handler / Server Action)
          ↓
    Validation (Zod)
          ↓
  Application Service (modules/*/service.ts)
          ↓
  Repository (modules/*/repository.ts)
          ↓
    Prisma Client
          ↓
     PostgreSQL
```

Each layer has a single job:

| Layer | Responsibility | Files |
|---|---|---|
| Route Handler | Auth check, parse body, call service, map errors to HTTP status | `src/app/api/**/*.ts` |
| Validation | Schema enforcement via Zod | `src/lib/validations.ts` |
| Service | Orchestrate business rules across repositories | `modules/*/service.ts` |
| Repository | All database access, no business logic | `modules/*/repository.ts` |
| Prisma | Query building, type generation | `prisma/schema.prisma` |

A route handler never queries the database directly. A repository never enforces business rules. This keeps each layer testable in isolation.

## Module Boundaries

```
src/modules/
  auth/       Registration, login, password hashing, user profile
  catalog/    Products, variants, genres, search, filtering, pagination
  cart/       Persistent cart, add/update/remove, server-side totals
  checkout/   Orchestrates cart → order → payment in a single flow
  orders/     Order creation, retrieval, status state machine
  inventory/  Stock tracking, admin adjustments, low-stock queries
  payments/   Payment provider abstraction, event recording
  admin/      Dashboard stats, product management, customer views
```

Modules communicate **downward and sideways** but not upward. `checkout` calls into `cart`, `orders`, and `payments`. `payments` does not know about `checkout`. This keeps dependencies from becoming cyclic.

### What Each Module Exports

Each module exposes a `service.ts` as its public API. The `repository.ts` is an implementation detail consumed only by its own service. External callers (route handlers, other services) import from the service, not the repository.

```typescript
// Correct
import * as cartService from '@/modules/cart/service'

// Wrong — bypasses service layer business rules
import * as cartRepository from '@/modules/cart/repository'
```

## Rendering Model

Next.js App Router gives us two rendering environments in the same codebase:

- **Server Components** (default): Run on the server, can query the database directly via services, never expose Prisma to the client. Used for all data-fetching pages (catalog, product detail, orders, admin dashboard).
- **Client Components** (`'use client'`): Run in the browser. Used for interactive elements — the cart hook, add-to-cart button, filters, checkout form, admin product form.

Business-critical operations (totals, inventory checks, status transitions) always run on the server regardless of which component triggers them.

## Security Boundaries

The server trusts nothing from the client except:
- The session token (validated by NextAuth on every request)
- Opaque IDs (variant IDs, item IDs) — these are always re-fetched and verified
- Form inputs (validated by Zod before use)

The server never trusts:
- Prices submitted by the client
- Inventory counts submitted by the client
- Roles submitted by the client
- User IDs submitted by the client (always read from the session)

## File Layout

```
src/
  app/
    (store)/          Customer-facing pages
    (auth)/           Login and registration pages
    admin/            Admin pages and components
    api/              Route handlers
  modules/            Business logic modules
  components/
    ui/               Primitive UI components (Button, Input, Badge, etc.)
    shared/           Composed application components (Navbar, GameCard, etc.)
  hooks/              Client-side React hooks (useCart)
  lib/
    prisma.ts         Singleton Prisma client
    auth.ts           NextAuth configuration
    utils.ts          Pure utility functions
    validations.ts    Zod schemas (shared between client and server)
prisma/
  schema.prisma       Database schema
  seed.ts             Development seed data
  migrations/         SQL migration history
```

## Embeddings

BAI/bge-small-en-v1.5 generates 384-dim vectors per game.

## AI Advisor

Llama 3.3 70B via HuggingFace router answers game questions.

## RAG Pipeline

Top-5 similar games injected into LLM context window.

## Conversation Memory

Advisor keeps last 10 messages as context for follow-ups.

## Personalization

Purchase embeddings bias similarity toward user's taste profile.

## Comparison Mode

Advisor compares two games across genre, price, and reviews.

## Feedback Loop

Users rate responses. Low-rated answers flagged for review.
