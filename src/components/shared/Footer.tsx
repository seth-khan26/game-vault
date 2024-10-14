import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold text-primary-text">
                Game<span className="text-accent">Vault</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-text max-w-xs">
              Your curated destination for PlayStation games. The best PS4 and PS5 titles, all in one place.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-text">Shop</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/games" className="text-sm text-muted-text hover:text-primary-text">All Games</Link></li>
              <li><Link href="/games?platform=PS5" className="text-sm text-muted-text hover:text-primary-text">PS5 Games</Link></li>
              <li><Link href="/games?platform=PS4" className="text-sm text-muted-text hover:text-primary-text">PS4 Games</Link></li>
              <li><Link href="/games?sort=newest" className="text-sm text-muted-text hover:text-primary-text">New Releases</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-text">Account</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/login" className="text-sm text-muted-text hover:text-primary-text">Sign In</Link></li>
              <li><Link href="/register" className="text-sm text-muted-text hover:text-primary-text">Create Account</Link></li>
              <li><Link href="/orders" className="text-sm text-muted-text hover:text-primary-text">Order History</Link></li>
              <li><Link href="/cart" className="text-sm text-muted-text hover:text-primary-text">Cart</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-text">
            © {new Date().getFullYear()} GameVault. All rights reserved.
          </p>
          <p className="text-xs text-muted-text">
            PlayStation, PS4, PS5 are registered trademarks of Sony Interactive Entertainment.
          </p>
        </div>
      </div>
    </footer>
  )
}
