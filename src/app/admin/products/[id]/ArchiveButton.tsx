'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Archive, ArchiveRestore } from 'lucide-react'

interface ArchiveButtonProps {
  productId: string
  currentStatus: string
}

export default function ArchiveButton({ productId, currentStatus }: ArchiveButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const isArchived = currentStatus === 'ARCHIVED'

  const handleClick = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: isArchived ? 'ACTIVE' : 'ARCHIVED' }),
    })
    setLoading(false)
    if (res.ok) {
      toast(isArchived ? 'Product restored!' : 'Product archived!', 'success')
      router.refresh()
    } else {
      toast('Failed to update status', 'error')
    }
  }

  return (
    <Button
      variant={isArchived ? 'outline' : 'destructive'}
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      {isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
      {isArchived ? 'Restore' : 'Archive'}
    </Button>
  )
}
