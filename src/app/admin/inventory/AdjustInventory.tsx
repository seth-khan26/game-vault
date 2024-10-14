'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface AdjustInventoryProps {
  variantId: string
  currentInventory: number
}

export default function AdjustInventory({ variantId, currentInventory }: AdjustInventoryProps) {
  const [value, setValue] = useState(currentInventory.toString())
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSave = async () => {
    const inventory = parseInt(value, 10)
    if (isNaN(inventory) || inventory < 0) return
    if (inventory === currentInventory) return
    setLoading(true)
    const res = await fetch('/api/admin/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, inventory }),
    })
    setLoading(false)
    if (res.ok) {
      toast('Inventory updated!', 'success')
      router.refresh()
    } else {
      toast('Update failed', 'error')
      setValue(currentInventory.toString())
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 h-8 text-sm"
        min="0"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={loading || value === currentInventory.toString()}
      >
        {loading ? '...' : 'Save'}
      </Button>
    </div>
  )
}
