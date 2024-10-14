export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { inventoryUpdateSchema } from '@/lib/validations'
import * as inventoryService from '@/modules/inventory/service'

function requireAdmin(session: any) {
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const guard = requireAdmin(session)
    if (guard) return guard

    const { searchParams } = new URL(req.url)
    const lowStock = searchParams.get('lowStock') === 'true'
    const threshold = parseInt(searchParams.get('threshold') ?? '5', 10)

    if (lowStock) {
      const items = await inventoryService.getLowStockItems(threshold)
      return NextResponse.json({ items })
    }

    const items = await inventoryService.getAllInventory()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/admin/inventory error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const guard = requireAdmin(session)
    if (guard) return guard

    const body = await req.json()
    const parsed = inventoryUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const item = await inventoryService.adjustInventory({
      variantId: parsed.data.variantId,
      inventory: parsed.data.inventory,
    })
    return NextResponse.json(item)
  } catch (error: any) {
    console.error('PATCH /api/admin/inventory error:', error)
    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
