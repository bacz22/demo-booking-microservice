import * as React from 'react'
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-2xl border p-4 text-xs sm:text-sm backdrop-blur-sm transition-all animate-in fade-in-50 [&>svg~*]:pl-8 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default:
          'bg-card/90 text-foreground border-border/60 [&>svg]:text-primary',
        destructive:
          'border-destructive/40 bg-destructive/10 text-destructive [&>svg]:text-destructive',
        success:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 [&>svg]:text-emerald-500',
        warning:
          'border-warning/40 bg-warning/10 text-warning [&>svg]:text-warning',
        info:
          'border-primary/40 bg-primary/10 text-primary [&>svg]:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Tuỳ chỉnh Icon (nếu không cung cấp sẽ dùng icon mặc định theo variant) */
  icon?: React.ReactNode
  /** Tắt hiển thị icon */
  hideIcon?: boolean
}

export function Alert({
  className,
  variant = 'default',
  icon,
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      case 'info':
      default:
        return <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
    }
  }

  return (
    <div
      role={variant === 'destructive' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {!hideIcon && (icon ?? getDefaultIcon())}
      <div className="leading-snug">{children}</div>
    </div>
  )
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('mb-1 font-bold text-sm tracking-tight leading-none', className)}
      {...props}
    />
  )
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-xs sm:text-sm [&_p]:leading-relaxed opacity-95', className)}
      {...props}
    />
  )
}

export default Alert
