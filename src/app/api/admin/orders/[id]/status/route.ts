export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orderStatusSchema } from '@/lib/validations'
import * as orderService from '@/modules/orders/service'

function requireAdmin(session: any) {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    const guard = requireAdmin(session)
    if (guard) return guard

    const body = await req.json()
    const parsed = orderStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const order = await orderService.updateOrderStatus(params.id, parsed.data.status)
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('PATCH /api/admin/orders/[id]/status error:', error)
    if (error.message === 'Order not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message?.includes('Invalid status transition')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
