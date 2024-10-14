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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    const guard = requireAdmin(session)
    if (guard) return guard

    const product = await adminService.getProductById(params.id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('GET /api/admin/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
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
    // Partial validation - only validate fields present in the body
    const parsed = productSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const existing = await adminService.getProductById(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await adminService.updateProduct(params.id, parsed.data as any)
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('PATCH /api/admin/products/[id] error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug or SKU already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    const guard = requireAdmin(session)
    if (guard) return guard

    const existing = await adminService.getProductById(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await adminService.archiveProduct(params.id)
    return NextResponse.json(product)
  } catch (error) {
    console.error('DELETE /api/admin/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 })
  }
}
