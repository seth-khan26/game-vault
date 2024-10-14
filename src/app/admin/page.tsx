import * as adminService from '@/modules/admin/service'
import { formatPrice, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { DollarSign, ShoppingBag, Package, AlertTriangle, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function AdminDashboard() {
  const stats = await adminService.getDashboardStats()

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      description: 'All time revenue',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      description: 'All orders placed',
    },
    {
      title: 'Active Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      description: 'Products in store',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      description: 'Items below 10 units',
      alert: stats.lowStockCount > 0,
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      description: 'Registered users',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary-text mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className={stat.alert ? 'border-danger/50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-text">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.alert ? 'text-danger' : 'text-muted-text'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stat.alert ? 'text-danger' : 'text-primary-text'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-text mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href="/admin/orders" className="font-medium text-accent hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-text">{order.user?.name || 'Unknown'}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell className="text-muted-text">{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(order.total.toString())}</TableCell>
                </TableRow>
              ))}
              {stats.recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-text py-8">No orders yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
