'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Warehouse, Users, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/customers', label: 'Customers', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface min-h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-accent" />
          <span className="font-bold text-primary-text">Game<span className="text-accent">Vault</span></span>
        </Link>
        <p className="text-xs text-muted-text mt-1">Admin Panel</p>
      </div>
      <nav className="px-3 pb-6">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-1',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-text hover:bg-elevated hover:text-primary-text'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
