import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { User } from 'lucide-react'
import Link from 'next/link'
import { Package } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/profile')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary-text mb-8">Profile</h1>

      <div className="rounded-lg border border-border bg-surface p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
            <User className="h-8 w-8 text-accent" />
          </div>
          <div>
            <p className="text-xl font-bold text-primary-text">{session.user?.name}</p>
            <p className="text-muted-text">{session.user?.email}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-text">Name</span>
            <span className="text-primary-text">{session.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Email</span>
            <span className="text-primary-text">{session.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Role</span>
            <span className="text-primary-text capitalize">{((session.user as any)?.role || 'customer').toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-semibold text-primary-text mb-4">Quick Links</h2>
        <div className="space-y-3">
          <Link href="/orders" className="flex items-center gap-3 text-muted-text hover:text-primary-text transition-colors">
            <Package className="h-4 w-4" />
            <span className="text-sm">View Order History</span>
          </Link>
          <Link href="/games" className="flex items-center gap-3 text-muted-text hover:text-primary-text transition-colors">
            <User className="h-4 w-4" />
            <span className="text-sm">Browse Games</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
