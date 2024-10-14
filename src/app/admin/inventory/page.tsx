import { getAllInventory } from '@/modules/inventory/service'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AdjustInventory from './AdjustInventory'

export default async function AdminInventoryPage() {
  const variants = await getAllInventory()

  const lowStockCount = variants.filter((v) => v.inventory < 10).length

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-text mb-8">Inventory</h1>

      {lowStockCount > 0 && (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 mb-6 text-sm text-danger">
          Warning: {lowStockCount} variant{lowStockCount !== 1 ? 's' : ''} have low stock (&lt; 10 units)
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Adjust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant: any) => (
              <TableRow key={variant.id} className={variant.inventory < 10 ? 'bg-danger/5' : ''}>
                <TableCell className="font-medium text-primary-text">{variant.product?.title}</TableCell>
                <TableCell>
                  <Badge variant={variant.platform === 'PS5' ? 'ps5' : 'ps4'}>{variant.platform}</Badge>
                </TableCell>
                <TableCell className="text-muted-text font-mono text-sm">{variant.sku}</TableCell>
                <TableCell>
                  <span
                    className={
                      variant.inventory < 10
                        ? 'text-danger font-bold'
                        : variant.inventory < 30
                        ? 'text-yellow-400'
                        : 'text-success'
                    }
                  >
                    {variant.inventory}
                  </span>
                  {variant.inventory < 10 && (
                    <span className="ml-2 text-xs text-danger font-semibold">LOW</span>
                  )}
                </TableCell>
                <TableCell>
                  <AdjustInventory variantId={variant.id} currentInventory={variant.inventory} />
                </TableCell>
              </TableRow>
            ))}
            {variants.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-text py-8">No variants found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
