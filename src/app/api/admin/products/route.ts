export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { productSchema } from '@/lib/validations'
import * as adminService from '@/modules/admin/service'

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
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const status = searchParams.get('status') ?? undefined

    const result = await adminService.getProducts({ page, limit, status })
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/admin/products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const guard = requireAdmin(session)
    if (guard) return guard

    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const product = await adminService.createProduct(parsed.data as any)
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/admin/products error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug or SKU already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
