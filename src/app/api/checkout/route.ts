export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkoutSchema } from '@/lib/validations'
import { processCheckout } from '@/modules/checkout/service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await processCheckout({
      userId: (session.user as any).id,
      shippingAddress: parsed.data.shippingAddress,
      saveAddress: parsed.data.saveAddress,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Payment failed', order: result.order },
        { status: 402 },
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/checkout error:', error)
    if (error.message === 'Cart is empty') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.message?.includes('Insufficient inventory')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 })
  }
}
