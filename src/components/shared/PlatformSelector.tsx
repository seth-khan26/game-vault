'use client'

import { cn } from '@/lib/utils'

interface PlatformSelectorProps {
  platforms: ('PS4' | 'PS5')[]
  selected: 'PS4' | 'PS5'
  onSelect: (platform: 'PS4' | 'PS5') => void
}

export default function PlatformSelector({ platforms, selected, onSelect }: PlatformSelectorProps) {
  return (
    <div className="flex gap-2">
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => onSelect(platform)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors border',
            selected === platform
              ? platform === 'PS5'
                ? 'bg-accent text-white border-accent'
                : 'bg-blue-600 text-white border-blue-600'
              : 'border-border text-muted-text hover:text-primary-text hover:border-muted-text'
          )}
        >
          {platform}
        </button>
      ))}
    </div>
  )
}
