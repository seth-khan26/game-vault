import { catalogService } from '@/modules/catalog/service'
import { catalogFilterSchema } from '@/lib/validations'
import GameCard from '@/components/shared/GameCard'
import CatalogFilters from '@/components/shared/CatalogFilters'
import CatalogSort from '@/components/shared/CatalogSort'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface GamesPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const filters = catalogFilterSchema.parse({
    platform: searchParams.platform,
    genre: searchParams.genre,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    year: searchParams.year,
    availability: searchParams.availability,
    sort: searchParams.sort || 'newest',
    q: searchParams.q,
    page: searchParams.page || 1,
    limit: 12,
  })

  const [result, genres] = await Promise.all([
    catalogService.getProducts(filters),
    catalogService.getGenres(),
  ])

  const totalPages = Math.ceil(result.total / result.limit)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-text">
          {filters.q ? `Search: "${filters.q}"` : 'All Games'}
        </h1>
        <p className="mt-2 text-muted-text">{result.total} games found</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <CatalogFilters
            genres={genres}
            currentFilters={filters}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <CatalogSort currentSort={filters.sort || 'newest'} />
          </div>

          {result.products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-text text-lg">No games found matching your filters.</p>
              <Link href="/games" className="mt-4 inline-block">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {result.products.map((game) => (
                  <GameCard key={game.id} game={game as any} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const params = new URLSearchParams(searchParams as Record<string, string>)
                    params.set('page', page.toString())
                    return (
                      <Link key={page} href={`/games?${params.toString()}`}>
                        <Button
                          variant={page === filters.page ? 'default' : 'outline'}
                          size="sm"
                        >
                          {page}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
