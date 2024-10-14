export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addToCartSchema } from '@/lib/validations'
import * as cartService from '@/modules/cart/service'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cart = await cartService.getCart((session.user as any).id)
    return NextResponse.json(cart)
  } catch (error) {
    console.error('GET /api/cart error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = addToCartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { variantId, quantity } = parsed.data
    const cart = await cartService.addToCart((session.user as any).id, variantId, quantity)
    return NextResponse.json(cart, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/cart error:', error)
    if (error.message === 'Variant not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Item is out of stock') {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 })
  }
}
