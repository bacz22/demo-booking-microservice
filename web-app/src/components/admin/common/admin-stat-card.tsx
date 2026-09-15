import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Coins,
  Ticket,
  Users,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import type { AdminKPIItem } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AdminStatCardProps {
  kpi: AdminKPIItem
  className?: string
}

export function AdminStatCard({ kpi, className }: AdminStatCardProps) {
  const { label, formattedValue, delta, periodLabel, tooltip, iconName } = kpi

  // Icon mapping
  const renderIcon = () => {
    const iconClass = 'w-5 h-5'
    switch (iconName) {
      case 'revenue':
        return <Coins className={iconClass} aria-hidden="true" />
      case 'booking':
        return <Ticket className={iconClass} aria-hidden="true" />
      case 'occupancy':
        return <Users className={iconClass} aria-hidden="true" />
      case 'payment_success':
        return <CheckCircle2 className={iconClass} aria-hidden="true" />
      default:
        return <Coins className={iconClass} aria-hidden="true" />
    }
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md',
        className
      )}
    >
      {/* Background Icon Watermark */}
      <div className="pointer-events-none absolute -right-2 -bottom-2 text-foreground/[0.04] dark:text-foreground/[0.03] transition-transform duration-300 group-hover:scale-110">
        {React.cloneElement(renderIcon(), { className: 'w-24 h-24 stroke-[1]' })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {tooltip && (
            <span
              title={tooltip}
              aria-label={tooltip}
              tabIndex={0}
              className="text-muted-foreground/60 hover:text-muted-foreground cursor-help outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
          {renderIcon()}
        </div>
      </div>

      {/* Value */}
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
          {formattedValue}
        </div>
      </div>

      {/* Delta & Period */}
      {delta && (
        <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold',
              delta.isPositive
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            )}
          >
            {delta.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {delta.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {delta.direction === 'neutral' && <Minus className="w-3 h-3" />}
            <span>
              {delta.direction === 'up' ? '+' : delta.direction === 'down' ? '-' : ''}
              {Math.abs(delta.percentage)}%
            </span>
          </div>
          <span className="text-muted-foreground truncate">{periodLabel}</span>
        </div>
      )}
    </div>
  )
}

export default AdminStatCard
