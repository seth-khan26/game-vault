'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Genre {
  id: string
  name: string
  slug: string
}

interface CatalogFiltersProps {
  genres: Genre[]
  currentFilters: any
}

export default function CatalogFilters({ genres, currentFilters }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/games?${params.toString()}`)
  }

  const clearAll = () => {
    router.push('/games')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary-text">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-muted-text">
          Clear all
        </Button>
      </div>

      {/* Platform */}
      <div>
        <Label className="text-sm text-muted-text mb-3 block">Platform</Label>
        <div className="space-y-2">
          {['PS5', 'PS4'].map((platform) => (
            <label key={platform} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="platform"
                value={platform}
                checked={currentFilters.platform === platform}
                onChange={() => updateFilter('platform', currentFilters.platform === platform ? undefined : platform)}
                className="accent-accent"
              />
              <span className="text-sm text-primary-text">{platform}</span>
            </label>
          ))}
          {currentFilters.platform && (
            <button
              onClick={() => updateFilter('platform', undefined)}
              className="text-xs text-accent hover:underline"
            >
              Clear platform
            </button>
          )}
        </div>
      </div>

      {/* Genre */}
      <div>
        <Label className="text-sm text-muted-text mb-3 block">Genre</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {genres.map((genre) => (
            <label key={genre.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="genre"
                value={genre.slug}
                checked={currentFilters.genre === genre.slug}
                onChange={() => updateFilter('genre', currentFilters.genre === genre.slug ? undefined : genre.slug)}
                className="accent-accent"
              />
              <span className="text-sm text-primary-text">{genre.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm text-muted-text mb-3 block">Price Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={currentFilters.minPrice || ''}
            onBlur={(e) => updateFilter('minPrice', e.target.value)}
            className="w-24 text-sm"
          />
          <span className="text-muted-text">-</span>
          <Input
            type="number"
            placeholder="Max"
            defaultValue={currentFilters.maxPrice || ''}
            onBlur={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-24 text-sm"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <Label className="text-sm text-muted-text mb-3 block">Availability</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentFilters.availability === 'in-stock'}
            onChange={(e) => updateFilter('availability', e.target.checked ? 'in-stock' : undefined)}
            className="accent-accent"
          />
          <span className="text-sm text-primary-text">In Stock Only</span>
        </label>
      </div>
    </div>
  )
}
