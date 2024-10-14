import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/20 text-accent',
        secondary: 'bg-elevated text-muted-text',
        destructive: 'bg-danger/20 text-danger',
        success: 'bg-success/20 text-success',
        outline: 'border border-border text-primary-text',
        ps4: 'bg-blue-500/20 text-blue-400',
        ps5: 'bg-accent/20 text-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
