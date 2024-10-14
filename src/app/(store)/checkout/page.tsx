'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { shippingAddressSchema } from '@/lib/validations'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Link from 'next/link'

type ShippingForm = z.infer<typeof shippingAddressSchema>

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { cart } = useCart()
  const [step, setStep] = useState<'address' | 'payment'>('address')
  const [shippingData, setShippingData] = useState<ShippingForm | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingForm>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: { country: 'US' },
  })

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-muted-text mb-4">Please sign in to checkout.</p>
        <Link href="/login?callbackUrl=/checkout">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-muted-text mb-4">Your cart is empty.</p>
        <Link href="/games"><Button>Browse Games</Button></Link>
      </div>
    )
  }

  const onAddressSubmit = (data: ShippingForm) => {
    setShippingData(data)
    setStep('payment')
  }

  const handlePayment = async () => {
    if (!shippingData) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: shippingData }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Checkout failed')
        setProcessing(false)
        return
      }
      router.push(`/orders/${data.order.id}?success=true`)
    } catch {
      setError('Something went wrong. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary-text mb-8">Checkout</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 text-sm ${step === 'address' ? 'text-accent' : 'text-success'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'address' ? 'bg-accent text-white' : 'bg-success text-white'}`}>
            {step === 'payment' ? '✓' : '1'}
          </div>
          Shipping Address
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 text-sm ${step === 'payment' ? 'text-accent' : 'text-muted-text'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'payment' ? 'bg-accent text-white' : 'bg-elevated text-muted-text'}`}>
            2
          </div>
          Payment
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === 'address' && (
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-primary-text mb-6">Shipping Address</h2>
              <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="line1">Address Line 1</Label>
                  <Input id="line1" {...register('line1')} className="mt-1" placeholder="123 Main St" />
                  {errors.line1 && <p className="text-danger text-xs mt-1">{errors.line1.message}</p>}
                </div>
                <div>
                  <Label htmlFor="line2">Address Line 2 (optional)</Label>
                  <Input id="line2" {...register('line2')} className="mt-1" placeholder="Apt, Suite, etc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register('city')} className="mt-1" placeholder="New York" />
                    {errors.city && <p className="text-danger text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register('state')} className="mt-1" placeholder="NY" />
                    {errors.state && <p className="text-danger text-xs mt-1">{errors.state.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" {...register('postalCode')} className="mt-1" placeholder="10001" />
                    {errors.postalCode && <p className="text-danger text-xs mt-1">{errors.postalCode.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register('country')} className="mt-1" defaultValue="US" />
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2">Continue to Payment</Button>
              </form>
            </div>
          )}

          {step === 'payment' && (
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-primary-text mb-4">Payment</h2>
              {shippingData && (
                <div className="rounded-md bg-elevated p-4 mb-6 text-sm">
                  <p className="text-muted-text text-xs mb-1">Shipping to:</p>
                  <p className="text-primary-text">{shippingData.line1}{shippingData.line2 ? `, ${shippingData.line2}` : ''}</p>
                  <p className="text-primary-text">{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                  <button onClick={() => setStep('address')} className="text-accent text-xs mt-1 hover:underline">Edit address</button>
                </div>
              )}
              <div className="rounded-md bg-elevated p-6 text-center mb-6">
                <p className="text-muted-text text-sm mb-2">Demo Payment</p>
                <p className="text-xs text-muted-text">This is a mock payment. Click Pay Now to complete your order.</p>
              </div>
              {error && <p className="text-danger text-sm mb-4">{error}</p>}
              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <><LoadingSpinner size="sm" className="mr-2" /> Processing...</>
                ) : (
                  `Pay ${formatPrice(cart.total)}`
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="rounded-lg border border-border bg-surface p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-primary-text mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-muted-text">
                  <span className="flex-1 line-clamp-1">{item.variant.product.title} ({item.variant.platform}) x{item.quantity}</span>
                  <span className="ml-2">{formatPrice(parseFloat(item.variant.price) * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-muted-text">
                  <span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-text">
                  <span>Shipping</span>
                  <span>{cart.shippingCost === 0 ? <span className="text-success">Free</span> : formatPrice(cart.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-muted-text">
                  <span>Tax</span><span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-primary-text text-base">
                  <span>Total</span><span className="text-accent">{formatPrice(cart.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
