import type { InventoryAdjustment, InventoryItem, LowStockItem } from './types'
import * as inventoryRepository from './repository'

export async function getAllInventory(): Promise<InventoryItem[]> {
  return inventoryRepository.getAllInventory()
}

export async function adjustInventory(
  adjustment: InventoryAdjustment,
): Promise<InventoryItem> {
  const { variantId, inventory } = adjustment

  if (inventory < 0) {
    throw new Error('Inventory cannot be negative')
  }

  const variant = await inventoryRepository.getVariantById(variantId)
  if (!variant) {
    throw new Error(`Variant ${variantId} not found`)
  }

  return inventoryRepository.setInventory(variantId, inventory)
}

export async function getLowStockItems(threshold = 5): Promise<LowStockItem[]> {
  const items = await inventoryRepository.getLowStockVariants(threshold)
  return items.map((item) => ({ ...item, threshold }))
}
