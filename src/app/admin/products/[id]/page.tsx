import { notFound } from 'next/navigation'
import * as adminService from '@/modules/admin/service'
import { catalogService } from '@/modules/catalog/service'
import ProductForm from '../ProductForm'
import ArchiveButton from './ArchiveButton'

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, genres] = await Promise.all([
    adminService.getProductById(params.id),
    catalogService.getGenres(),
  ])
  if (!product) notFound()

  // Transform product to form-compatible shape
  const initialData = {
    title: product.title,
    slug: product.slug,
    description: product.description ?? '',
    developer: product.developer,
    publisher: product.publisher,
    releaseDate: new Date(product.releaseDate).toISOString().split('T')[0],
    status: product.status as 'ACTIVE' | 'ARCHIVED',
    isFeatured: product.isFeatured,
    genreIds: product.genres.map((g: any) => g.id),
    images: product.images.map((img: any) => ({
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
    })),
    variants: product.variants.map((v: any) => ({
      platform: v.platform as 'PS4' | 'PS5',
      sku: v.sku,
      price: parseFloat(v.price.toString()),
      inventory: v.inventory,
    })),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary-text">Edit Product</h1>
        <ArchiveButton productId={params.id} currentStatus={product.status} />
      </div>
      <ProductForm genres={genres} initialData={initialData} productId={params.id} />
    </div>
  )
}
