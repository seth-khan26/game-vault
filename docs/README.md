# GameVault Documentation

Senior-level implementation docs for the GameVault PS4/PS5 store.

## Contents

| Document | What it covers |
|---|---|
| [architecture.md](./architecture.md) | Layer stack, module boundaries, rendering model, security boundaries |
| [data-model.md](./data-model.md) | All entities, relationships, constraints, decimal types, soft delete |
| [auth.md](./auth.md) | NextAuth setup, JWT strategy, RBAC enforcement, session security |
| [catalog.md](./catalog.md) | Product/variant model, filtering, search, sorting, pagination |
| [cart.md](./cart.md) | Persistence, server-side totals, inventory capping, ownership checks |
| [checkout.md](./checkout.md) | Full flow, atomic inventory deduction, race condition handling |
| [orders.md](./orders.md) | State machine, OrderItem snapshots, order numbers, admin management |
| [inventory.md](./inventory.md) | Per-variant stock, deduction mechanics, low-stock alerts |
| [payments.md](./payments.md) | Provider abstraction, mock provider, idempotency, refunds |
| [admin.md](./admin.md) | Dashboard, product CRUD, order management, inventory adjustments |
| [api.md](./api.md) | Complete endpoint reference with request/response shapes |
| [decisions.md](./decisions.md) | Engineering decisions log — the "why" behind non-obvious choices |
| [local-setup.md](./local-setup.md) | Getting started, environment variables, database commands |

## Key Design Principles

- **Business rules live in services, not components.** React components call services; they do not contain business logic.
- **Never trust the client** for prices, totals, inventory counts, roles, or user IDs. All are derived server-side from the session and database.
- **OrderItems snapshot at purchase time.** Historical orders are never reconstructed from the current product state.
- **Inventory deduction is transactional.** Concurrent checkout requests cannot oversell.
- **State machines are explicit.** Order status transitions are defined as a typed map; invalid transitions throw before any write.
- **Payments are provider-agnostic.** Swapping from mock to Stripe requires changing one import and adding one file.
