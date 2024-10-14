import * as adminService from '@/modules/admin/service'
import { formatPrice } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminProductsPage() {
  const { products } = await adminService.getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary-text">Products</h1>
        <Link href="/admin/products/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Platforms</TableHead>
              <TableHead>Price Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => {
              const ps4 = product.variants.find((v: any) => v.platform === 'PS4')
              const ps5 = product.variants.find((v: any) => v.platform === 'PS5')
              const prices = product.variants.map((v: any) => parseFloat(v.price.toString()))
              const minPrice = Math.min(...prices)
              const maxPrice = Math.max(...prices)
              const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.inventory, 0)

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-primary-text">{product.title}</p>
                      <p className="text-xs text-muted-text">{product.developer}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ps5 && <Badge variant="ps5">PS5</Badge>}
                      {ps4 && <Badge variant="ps4">PS4</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-text">
                    {prices.length === 0
                      ? '—'
                      : prices.length === 1 || minPrice === maxPrice
                      ? formatPrice(minPrice)
                      : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
                  </TableCell>
                  <TableCell><StatusBadge status={product.status} /></TableCell>
                  <TableCell>
                    <span className={totalStock < 10 ? 'text-danger font-medium' : 'text-primary-text'}>
                      {totalStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-text py-8">No products yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
