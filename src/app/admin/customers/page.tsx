import * as adminService from '@/modules/admin/service'
import { formatPrice, formatDate } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminCustomersPage() {
  const { customers } = await adminService.getCustomers()

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-text mb-8">Customers</h1>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer: any) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium text-primary-text">{customer.name}</TableCell>
                <TableCell className="text-muted-text">{customer.email}</TableCell>
                <TableCell className="text-muted-text">{formatDate(customer.createdAt)}</TableCell>
                <TableCell className="text-right">{customer._count?.orders ?? 0}</TableCell>
                <TableCell className="text-right font-semibold text-accent">
                  {formatPrice(customer.totalSpent ?? 0)}
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-text py-8">No customers yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
