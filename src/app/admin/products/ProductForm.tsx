'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { slugify } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  developer: z.string().min(1, 'Developer is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  releaseDate: z.string().min(1, 'Release date is required'),
  status: z.enum(['ACTIVE', 'ARCHIVED']),
  isFeatured: z.boolean(),
  genreIds: z.array(z.string()),
  images: z.array(z.object({
    url: z.string().url('Must be a valid URL'),
    alt: z.string().min(1, 'Alt text is required'),
    isPrimary: z.boolean(),
  })),
  variants: z.array(z.object({
    platform: z.enum(['PS4', 'PS5']),
    sku: z.string().min(1, 'SKU is required'),
    price: z.coerce.number().positive('Price must be positive'),
    inventory: z.coerce.number().int().min(0, 'Inventory cannot be negative'),
  })),
})

type FormData = z.infer<typeof formSchema>

interface Genre {
  id: string
  name: string
  slug: string
}

interface ProductFormProps {
  genres: Genre[]
  initialData?: Partial<FormData>
  productId?: string
}

export default function ProductForm({ genres, initialData, productId }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      title: '',
      slug: '',
      description: '',
      developer: '',
      publisher: '',
      releaseDate: '',
      status: 'ACTIVE',
      isFeatured: false,
      genreIds: [],
      images: [{ url: '', alt: '', isPrimary: true }],
      variants: [{ platform: 'PS5', sku: '', price: 69.99, inventory: 50 }],
    },
  })

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control, name: 'images' })
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' })

  const title = watch('title')
  useEffect(() => {
    if (!productId && title) {
      setValue('slug', slugify(title))
    }
  }, [title, productId, setValue])

  const selectedGenreIds = watch('genreIds') ?? []

  const toggleGenre = (genreId: string) => {
    const current = selectedGenreIds
    if (current.includes(genreId)) {
      setValue('genreIds', current.filter((id) => id !== genreId))
    } else {
      setValue('genreIds', [...current, genreId])
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products'
      const method = productId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Save failed', 'error')
        setLoading(false)
        return
      }
      toast(productId ? 'Product updated!' : 'Product created!', 'success')
      router.push('/admin/products')
      router.refresh()
    } catch {
      toast('Something went wrong', 'error')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Info */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-primary-text mb-6">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input {...register('title')} className="mt-1" placeholder="God of War Ragnarök" />
            {errors.title && <p className="text-danger text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Slug</Label>
            <Input {...register('slug')} className="mt-1" placeholder="god-of-war-ragnarok" />
            {errors.slug && <p className="text-danger text-xs mt-1">{errors.slug.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea {...register('description')} className="mt-1 min-h-[120px]" />
            {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <Label>Developer</Label>
            <Input {...register('developer')} className="mt-1" />
            {errors.developer && <p className="text-danger text-xs mt-1">{errors.developer.message}</p>}
          </div>
          <div>
            <Label>Publisher</Label>
            <Input {...register('publisher')} className="mt-1" />
            {errors.publisher && <p className="text-danger text-xs mt-1">{errors.publisher.message}</p>}
          </div>
          <div>
            <Label>Release Date</Label>
            <Input type="date" {...register('releaseDate')} className="mt-1" />
            {errors.releaseDate && <p className="text-danger text-xs mt-1">{errors.releaseDate.message}</p>}
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register('status')} className="mt-1 w-full">
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isFeatured" {...register('isFeatured')} className="accent-accent h-4 w-4" />
            <Label htmlFor="isFeatured">Featured product</Label>
          </div>
        </div>
      </div>

      {/* Genres */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-primary-text mb-4">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedGenreIds.includes(genre.id)
                  ? 'bg-accent text-white border-accent'
                  : 'border-border text-muted-text hover:border-muted-text'
              }`}
            >
              {genre.name}
            </button>
          ))}
          {genres.length === 0 && (
            <p className="text-muted-text text-sm">No genres available</p>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-text">Images</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendImage({ url: '', alt: '', isPrimary: false })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Image
          </Button>
        </div>
        <div className="space-y-4">
          {imageFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 rounded-md bg-elevated">
              <div className="sm:col-span-2">
                <Label>Image URL</Label>
                <Input {...register(`images.${index}.url`)} className="mt-1" placeholder="https://..." />
                {errors.images?.[index]?.url && (
                  <p className="text-danger text-xs mt-1">{errors.images[index]?.url?.message}</p>
                )}
              </div>
              <div>
                <Label>Alt Text</Label>
                <Input {...register(`images.${index}.alt`)} className="mt-1" placeholder="Game cover art" />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`images.${index}.isPrimary`}
                  {...register(`images.${index}.isPrimary`)}
                  className="accent-accent h-4 w-4"
                />
                <Label htmlFor={`images.${index}.isPrimary`}>Primary</Label>
                {imageFields.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-text">Platform Variants</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendVariant({ platform: 'PS4', sku: '', price: 59.99, inventory: 50 })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
          </Button>
        </div>
        <div className="space-y-4">
          {variantFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end p-4 rounded-md bg-elevated">
              <div>
                <Label>Platform</Label>
                <Select {...register(`variants.${index}.platform`)} className="mt-1 w-full">
                  <option value="PS5">PS5</option>
                  <option value="PS4">PS4</option>
                </Select>
              </div>
              <div>
                <Label>SKU</Label>
                <Input {...register(`variants.${index}.sku`)} className="mt-1" placeholder="GV-GOW-PS5" />
                {errors.variants?.[index]?.sku && (
                  <p className="text-danger text-xs mt-1">{errors.variants[index]?.sku?.message}</p>
                )}
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`variants.${index}.price`)}
                  className="mt-1"
                />
                {errors.variants?.[index]?.price && (
                  <p className="text-danger text-xs mt-1">{errors.variants[index]?.price?.message}</p>
                )}
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Inventory</Label>
                  <Input
                    type="number"
                    min="0"
                    {...register(`variants.${index}.inventory`)}
                    className="mt-1"
                  />
                </div>
                {variantFields.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeVariant(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
