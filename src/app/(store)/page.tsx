import Link from 'next/link'
import { ArrowRight, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GameCard from '@/components/shared/GameCard'
import { catalogService } from '@/modules/catalog/service'

async function getFeaturedGames() {
  return catalogService.getFeaturedProducts()
}
async function getNewReleases() {
  return catalogService.getNewReleases(8)
}
async function getPopularGames() {
  return catalogService.getPopularProducts(8)
}

export default async function HomePage() {
  const [featured, newReleases, popular] = await Promise.all([
    getFeaturedGames(),
    getNewReleases(),
    getPopularGames(),
  ])

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-surface to-background border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent mb-6">
              <Zap className="h-3 w-3" />
              PS4 & PS5 Games
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary-text sm:text-5xl lg:text-6xl">
              PlayStation Games.{' '}
              <span className="text-accent">Curated for You.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-text">
              Discover the best PS4 and PS5 titles. From exclusive blockbusters to indie gems — your next favorite game is here.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/games">
                <Button size="lg" className="gap-2">
                  Browse All Games <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/games?platform=PS5">
                <Button size="lg" variant="outline" className="gap-2">
                  Explore PS5 <Zap className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primary-text mb-6">Shop by Platform</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/games?platform=PS5" className="group">
            <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-accent/20 to-accent/5 p-8 transition-all hover:border-accent/50">
              <div className="text-6xl font-black text-accent/20 absolute right-4 top-4 select-none">PS5</div>
              <h3 className="text-2xl font-bold text-primary-text">PlayStation 5</h3>
              <p className="mt-2 text-muted-text">Next-gen exclusives and cross-gen hits</p>
              <div className="mt-4 inline-flex items-center gap-2 text-accent text-sm font-medium group-hover:gap-3 transition-all">
                Shop PS5 <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
          <Link href="/games?platform=PS4" className="group">
            <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-blue-600/20 to-blue-600/5 p-8 transition-all hover:border-blue-600/50">
              <div className="text-6xl font-black text-blue-600/20 absolute right-4 top-4 select-none">PS4</div>
              <h3 className="text-2xl font-bold text-primary-text">PlayStation 4</h3>
              <p className="mt-2 text-muted-text">Classic titles and backward-compatible games</p>
              <div className="mt-4 inline-flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                Shop PS4 <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Games */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <h2 className="text-2xl font-bold text-primary-text">Featured Games</h2>
            </div>
            <Link href="/games?featured=true" className="text-sm text-accent hover:text-accent/80">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featured.slice(0, 5).map((game) => (
              <GameCard key={game.id} game={game as any} />
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {newReleases.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <h2 className="text-2xl font-bold text-primary-text">New Releases</h2>
            </div>
            <Link href="/games?sort=newest" className="text-sm text-accent hover:text-accent/80">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newReleases.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game as any} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Games */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary-text">Popular Games</h2>
            <Link href="/games?sort=popularity" className="text-sm text-accent hover:text-accent/80">
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popular.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
