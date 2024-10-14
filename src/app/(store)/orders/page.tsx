import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ordersService } from '@/modules/orders/service'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatPrice, formatDate } from '@/lib/utils'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/orders')

  const orders = await ordersService.getOrdersByUser((session.user as any).id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary-text mb-8">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-text mx-auto mb-4" />
          <p className="text-muted-text mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/games"><Button>Browse Games</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block">
              <div className="rounded-lg border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-primary-text">{order.orderNumber}</p>
                    <p className="text-sm text-muted-text mt-0.5">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-muted-text mt-1">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-lg font-bold text-accent mt-2">{formatPrice(order.total.toString())}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
