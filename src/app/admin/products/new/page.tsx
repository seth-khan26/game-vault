import { catalogService } from '@/modules/catalog/service'
import ProductForm from '../ProductForm'

export default async function NewProductPage() {
  const genres = await catalogService.getGenres()
  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-text mb-8">Add New Product</h1>
      <ProductForm genres={genres} />
    </div>
  )
}
