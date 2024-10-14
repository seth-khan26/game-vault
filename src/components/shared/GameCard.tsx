import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

interface GameCardProps {
  game: {
    id: string
    title: string
    slug: string
    developer: string
    images: { url: string; alt: string; isPrimary: boolean }[]
    genres: { name: string; slug: string }[]
    variants: {
      platform: 'PS4' | 'PS5'
      price: any
      inventory: number
    }[]
  }
}

export default function GameCard({ game }: GameCardProps) {
  const primaryImage = game.images.find((i) => i.isPrimary) || game.images[0]
  const ps5Variant = game.variants.find((v) => v.platform === 'PS5')
  const ps4Variant = game.variants.find((v) => v.platform === 'PS4')
  const lowestPrice = game.variants.reduce((min, v) => {
    const price = parseFloat(v.price.toString())
    return price < min ? price : min
  }, Infinity)
  const isInStock = game.variants.some((v) => v.inventory > 0)

  return (
    <Link href={`/games/${game.slug}`} className="group block">
      <div className="rounded-lg border border-border bg-surface overflow-hidden transition-all duration-200 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
        <div className="relative aspect-[4/5] overflow-hidden bg-elevated">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-text text-sm">
              No Image
            </div>
          )}
          {!isInStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-text">Out of Stock</span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {ps5Variant && <Badge variant="ps5">PS5</Badge>}
            {ps4Variant && <Badge variant="ps4">PS4</Badge>}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-primary-text text-sm line-clamp-1 group-hover:text-accent transition-colors">
            {game.title}
          </h3>
          <p className="text-xs text-muted-text mt-0.5">{game.developer}</p>
          {game.genres.length > 0 && (
            <p className="text-xs text-muted-text mt-1 line-clamp-1">
              {game.genres.slice(0, 2).map((g) => g.name).join(' • ')}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-accent">
              {lowestPrice === Infinity ? 'N/A' : `From ${formatPrice(lowestPrice)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
