import { prisma } from '@/lib/prisma'
import type { InventoryItem } from './types'

export async function getAllInventory(): Promise<InventoryItem[]> {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: [{ product: { title: 'asc' } }, { platform: 'asc' }],
  })

  return variants as InventoryItem[]
}

export async function getVariantById(variantId: string): Promise<InventoryItem | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
    },
  })
  return variant as InventoryItem | null
}

export async function setInventory(variantId: string, inventory: number): Promise<InventoryItem> {
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { inventory },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
    },
  })
  return variant as InventoryItem
}

export async function getLowStockVariants(threshold = 5): Promise<InventoryItem[]> {
  const variants = await prisma.productVariant.findMany({
    where: { inventory: { lte: threshold } },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: { inventory: 'asc' },
  })
  return variants as InventoryItem[]
}
