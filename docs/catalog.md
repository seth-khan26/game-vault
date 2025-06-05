# Catalog

## Product Model

A game title is a `Product`. Its purchasable units are `ProductVariant` records, one per platform:

```
Product: "God of War Ragnarök"
  variants:
    - platform: PS4, sku: GV-GOWR-PS4, price: 49.99, inventory: 60
    - platform: PS5, sku: GV-GOWR-PS5, price: 59.99, inventory: 95
```

This avoids duplicating title, description, developer, publisher, and genre information across platforms. The catalog UI selects a variant based on the user's platform choice.

## Filtering

Filters are represented entirely in URL query parameters. This makes catalog pages bookmarkable and shareable:

```
/games?platform=ps5&genre=action-rpg&minPrice=40&sort=newest
```

Filters are parsed and validated server-side using the `catalogFilterSchema` Zod schema before any database query runs. Invalid or missing values fall back to safe defaults (e.g., `sort` defaults to `newest`, `page` defaults to `1`).

### Supported Filters

| Parameter | Type | Effect |
|---|---|---|
| `q` | string | Full-text search across title, developer, publisher |
| `platform` | `PS4 \| PS5` | Filters to products that have a variant for that platform |
| `genre` | string (slug) | Filters to products tagged with that genre |
| `minPrice` | number | Variant price ≥ minPrice |
| `maxPrice` | number | Variant price ≤ maxPrice |
| `year` | number | `releaseDate` falls within that calendar year |
| `availability` | `in-stock \| all` | Variant `inventory > 0` |
| `sort` | see below | Ordering |
| `page` | number | Pagination offset |
| `limit` | number (max 48) | Page size |

### How Platform and Price Filters Work

Platform, price, and availability filters apply to variants, not products. The query uses `variants: { some: variantFilter }` — a product is included if **at least one** of its variants matches the filter conditions.

```typescript
const variantFilter: Prisma.ProductVariantWhereInput = {}

if (platform) variantFilter.platform = platform
if (minPrice !== undefined) variantFilter.price = { gte: minPrice }
if (availability === 'in-stock') variantFilter.inventory = { gt: 0 }

if (Object.keys(variantFilter).length > 0) {
  where.variants = { some: variantFilter }
}
```

This means filtering by `platform=PS5` returns products that have a PS5 variant (even if they also have a PS4 variant).

## Sorting

| Value | Behavior |
|---|---|
| `newest` | `releaseDate DESC` — most recently released games first |
| `relevance` | `title ASC` when a search query is present |
| `price_asc` | In-memory sort by minimum variant price |
| `price_desc` | In-memory sort by maximum variant price |
| `popularity` | Products ordered by total units sold across all variants |

### Why Price Sort is In-Memory

Prisma cannot directly `ORDER BY` across a related table's aggregated column in a single query. Sorting by minimum variant price requires fetching the page of results and sorting in JavaScript. This is acceptable for a typical page size of 12 items. If this becomes a performance bottleneck, the solution is a raw SQL query or a denormalized `minPrice` column on the `Product` table.

### Popularity Calculation

Popularity is computed from `OrderItem` records:

```typescript
// 1. Group order items by variantId, sum quantities
const popularVariants = await prisma.orderItem.groupBy({
  by: ['variantId'],
  _sum: { quantity: true },
  orderBy: { _sum: { quantity: 'desc' } },
})

// 2. Look up the product for each variant, deduplicate
// 3. Return products in popularity order
```

If no orders exist yet (fresh install), popularity falls back to `getNewReleases()`.

## Search

Search uses PostgreSQL `ILIKE` (case-insensitive `LIKE`) across three fields:

```typescript
where.OR = [
  { title: { contains: q, mode: 'insensitive' } },
  { developer: { contains: q, mode: 'insensitive' } },
  { publisher: { contains: q, mode: 'insensitive' } },
]
```

The `mode: 'insensitive'` flag uses `citext` or `ILIKE` depending on the PostgreSQL version. This is good enough for the MVP. Swapping this out for PostgreSQL full-text search (`to_tsvector` + `to_tsquery`) or an external search engine (Algolia, Meilisearch) requires only changing the repository query — the service and UI layers are unaffected.

## Product Detail

`getProductBySlug` fetches a single product by its URL slug, with all variants and images. It filters to `status: 'ACTIVE'` so archived products return `null` and the page shows a 404.

The product detail page renders a `PlatformSelector` component when the product has more than one variant. Selecting a different platform updates the displayed price, SKU, and inventory availability client-side without a page navigation — the variants are all embedded in the initial server render.

## Projection (What Gets Selected)

The catalog uses a `productSelect` projection that excludes heavy fields like `description`:

```typescript
const productSelect = {
  id, title, slug, developer, publisher, releaseDate, status, isFeatured,
  images: { select: { url, alt, isPrimary }, orderBy: { sortOrder: 'asc' } },
  genres: { select: { id, name, slug } },
  variants: { select: { id, platform, sku, price, inventory } },
}
```

The full `description` field is only fetched on the product detail page via `productDetailSelect`. This keeps catalog list queries lean — description can be several kilobytes per product.

## Genres

Genres have their own table with `name` and `slug` fields. Products relate to genres via a many-to-many join table managed by Prisma. The `slug` (e.g., `action-rpg`) is used in URL parameters; the `name` (e.g., `Action-RPG`) is displayed in the UI.

`getGenres()` is called alongside the catalog query to populate the filter sidebar. Both calls run in parallel via `Promise.all`.

## Pagination

```typescript
const skip = (page - 1) * limit
const [products, total] = await Promise.all([
  prisma.product.findMany({ where, skip, take: limit }),
  prisma.product.count({ where }),
])
return { products, total, page, limit, totalPages: Math.ceil(total / limit) }
```

`count` and `findMany` run in parallel with the same `where` clause. The `totalPages` value drives the pagination UI. Page links are plain `<a>` tags that serialize all current filter state into the URL — there is no client-side state for pagination.

## Catalog API

`GET /api/games?platform=PS5&genre=RPG&page=1` — server-rendered.

## Layout

Persistent header with search bar, cart icon, and auth state.

## Editions

PS4 and PS5 editions with independent price, SKU, and stock.

## Filters

Filter by platform, genre, price, release year, in-stock only.

## Game Detail

Detail page shows both editions with price and availability.
