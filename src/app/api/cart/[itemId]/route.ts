export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateCartItemSchema } from '@/lib/validations'
import * as cartService from '@/modules/cart/service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateCartItemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const cart = await cartService.updateCartItem(
      (session.user as any).id,
      params.itemId,
      parsed.data.quantity,
    )
    return NextResponse.json(cart)
  } catch (error: any) {
    console.error('PATCH /api/cart/[itemId] error:', error)
    if (error.message === 'Cart item not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cart = await cartService.removeCartItem((session.user as any).id, params.itemId)
    return NextResponse.json(cart)
  } catch (error: any) {
    console.error('DELETE /api/cart/[itemId] error:', error)
    if (error.message === 'Cart item not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 })
  }
}
