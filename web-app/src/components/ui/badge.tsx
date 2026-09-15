import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary:
          'border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25',
        outline: 'border-border text-foreground hover:bg-secondary/60',
        success:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        warning:
          'border-warning/40 bg-warning/15 text-warning',
        info:
          'border-primary/40 bg-primary/15 text-primary',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] leading-tight',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3.5 py-1 text-sm font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export default Badge
