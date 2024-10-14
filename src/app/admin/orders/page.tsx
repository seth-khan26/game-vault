import * as adminService from '@/modules/admin/service'
import { formatPrice, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import UpdateOrderStatus from './UpdateOrderStatus'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminOrdersPage() {
  const { orders } = await adminService.getOrders()

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-text mb-8">Orders</h1>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-accent">{order.orderNumber}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-primary-text">{order.user?.name}</p>
                    <p className="text-xs text-muted-text">{order.user?.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-text">
                  {order._count?.items ?? order.items?.length ?? 0}
                </TableCell>
                <TableCell><StatusBadge status={order.status} /></TableCell>
                <TableCell className="text-muted-text">{formatDate(order.createdAt)}</TableCell>
                <TableCell className="text-right font-semibold">{formatPrice(order.total.toString())}</TableCell>
                <TableCell>
                  <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-text py-8">No orders yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
