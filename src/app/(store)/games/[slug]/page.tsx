import { notFound } from 'next/navigation'
import Image from 'next/image'
import { catalogService } from '@/modules/catalog/service'
import GameCard from '@/components/shared/GameCard'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import AddToCartSection from './AddToCartSection'

interface ProductPageProps {
  params: { slug: string }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await catalogService.getProductBySlug(params.slug)
  if (!product) notFound()

  const related = await catalogService.getRelatedProducts(product.id, product.genres.map(g => g.id))

  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0]
  const platforms = Array.from(new Set(product.variants.map((v) => v.platform))) as ('PS4' | 'PS5')[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Product detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Image */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border bg-elevated max-w-md mx-auto lg:mx-0 w-full">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-text">No Image</div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.genres.map((g) => (
              <Badge key={g.id} variant="secondary">{g.name}</Badge>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-primary-text mb-2">{product.title}</h1>
          <p className="text-muted-text mb-6">{product.developer} · {product.publisher}</p>

          {/* Platform selector + Add to cart (client) */}
          <AddToCartSection
            product={{
              id: product.id,
              title: product.title,
              variants: product.variants.map(v => ({
                ...v,
                price: v.price.toString(),
              })),
            }}
            platforms={platforms}
          />

          {/* Game info */}
          <div className="mt-8 border-t border-border pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-text">Developer</span>
                <p className="text-primary-text font-medium">{product.developer}</p>
              </div>
              <div>
                <span className="text-muted-text">Publisher</span>
                <p className="text-primary-text font-medium">{product.publisher}</p>
              </div>
              <div>
                <span className="text-muted-text">Release Date</span>
                <p className="text-primary-text font-medium">{formatDate(product.releaseDate)}</p>
              </div>
              <div>
                <span className="text-muted-text">Platforms</span>
                <p className="text-primary-text font-medium">{platforms.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-primary-text mb-2">About this game</h2>
            <p className="text-muted-text leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Related games */}
      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-primary-text mb-6">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {related.map((game) => (
              <GameCard key={game.id} game={game as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
