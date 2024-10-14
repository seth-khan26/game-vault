import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { ordersService } from '@/modules/orders/service'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface OrderDetailPageProps {
  params: { id: string }
  searchParams: { success?: string }
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  const order = await ordersService.getOrderById(params.id)
  if (!order) notFound()
  if (order.userId !== userId && userRole !== 'ADMIN') notFound()

  const isSuccess = searchParams.success === 'true'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {isSuccess && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 mb-8 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="font-semibold text-success">Order placed successfully!</p>
            <p className="text-sm text-muted-text">Thank you for your purchase. Your order is being processed.</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">{order.orderNumber}</h1>
          <p className="text-muted-text mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-border bg-surface p-6 mb-6">
        <h2 className="font-semibold text-primary-text mb-4">Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div>
                <p className="font-medium text-primary-text">{item.productTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={item.platform === 'PS5' ? 'ps5' : 'ps4'}>{item.platform}</Badge>
                  <span className="text-xs text-muted-text">SKU: {item.sku}</span>
                </div>
                <p className="text-sm text-muted-text mt-0.5">Qty: {item.quantity} x {formatPrice(item.unitPrice.toString())}</p>
              </div>
              <p className="font-semibold text-accent">{formatPrice(item.totalPrice.toString())}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="rounded-lg border border-border bg-surface p-6 mb-6">
        <h2 className="font-semibold text-primary-text mb-4">Shipping Address</h2>
        <p className="text-muted-text text-sm">
          {order.shippingLine1}
          {order.shippingLine2 && <span>, {order.shippingLine2}</span>}<br />
          {order.shippingCity}, {order.shippingState} {order.shippingPostal}<br />
          {order.shippingCountry}
        </p>
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-semibold text-primary-text mb-4">Order Total</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-text">
            <span>Subtotal</span><span>{formatPrice(order.subtotal.toString())}</span>
          </div>
          <div className="flex justify-between text-muted-text">
            <span>Shipping</span><span>{formatPrice(order.shippingCost.toString())}</span>
          </div>
          <div className="flex justify-between text-muted-text">
            <span>Tax</span><span>{formatPrice(order.tax.toString())}</span>
          </div>
          <div className="flex justify-between font-semibold text-primary-text text-base border-t border-border pt-2">
            <span>Total</span><span className="text-accent">{formatPrice(order.total.toString())}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    </div>
  )
}
