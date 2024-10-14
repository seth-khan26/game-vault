import type { CatalogFilters, PaginatedProducts, ProductDetail, ProductListItem } from './types'
import * as catalogRepository from './repository'

export async function getProducts(filters: CatalogFilters): Promise<PaginatedProducts> {
  return catalogRepository.getProducts(filters)
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return catalogRepository.getProductBySlug(slug)
}

export async function getRelatedProducts(
  productId: string,
  genreIds: string[],
  limit = 4,
): Promise<ProductListItem[]> {
  return catalogRepository.getRelatedProducts(productId, genreIds, limit)
}

export async function getFeaturedProducts(limit = 6): Promise<ProductListItem[]> {
  return catalogRepository.getFeaturedProducts(limit)
}

export async function getNewReleases(limit = 8): Promise<ProductListItem[]> {
  return catalogRepository.getNewReleases(limit)
}

export async function getPopularProducts(limit = 8): Promise<ProductListItem[]> {
  return catalogRepository.getPopularProducts(limit)
}

export async function getGenres() {
  return catalogRepository.getGenres()
}

export const catalogService = {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  getFeaturedProducts,
  getNewReleases,
  getPopularProducts,
  getGenres,
}
