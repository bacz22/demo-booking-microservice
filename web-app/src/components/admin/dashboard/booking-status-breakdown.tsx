import { PieChart } from 'lucide-react'
import type { BookingStatusBreakdown } from '@/types/admin'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { cn } from '@/lib/utils'

interface BookingStatusBreakdownCardProps {
  data: BookingStatusBreakdown[]
  className?: string
}

export function BookingStatusBreakdownCard({ data, className }: BookingStatusBreakdownCardProps) {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0)

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between',
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div>
            <h2 className="text-base sm:text-lg font-heading font-black tracking-tight text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              <span>Phân Bổ Trạng Thái Vé</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tỷ trọng 5 nhóm trạng thái đơn đặt vé trong hệ thống
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tổng đơn</span>
            <span className="text-sm font-black font-mono text-foreground">{formatNumber(totalCount)}</span>
          </div>
        </div>

        {/* Stacked Proportional Bar Visualizer */}
        <div className="mt-5 space-y-2">
          <div
            className="w-full h-3.5 rounded-full overflow-hidden flex bg-secondary/80 p-0.5 gap-0.5"
            role="progressbar"
            aria-label="Tỷ trọng trạng thái vé"
          >
            {data.map((item) => (
              <div
                key={item.status}
                className={cn('h-full first:rounded-l-full last:rounded-r-full transition-all duration-300', item.colorClass)}
                style={{ width: `${item.percentage}%` }}
                title={`${item.label}: ${item.percentage}% (${formatNumber(item.count)} đơn)`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>0%</span>
            <span>Tỷ trọng 100%</span>
          </div>
        </div>

        {/* Individual Status Breakdown Rows */}
        <div className="mt-5 space-y-3.5">
          {data.map((item) => (
            <div key={item.status} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AdminStatusBadge status={item.status} label={item.label} size="sm" />
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-foreground">{formatNumber(item.count)}</span>
                  <span className="text-muted-foreground">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress bar for this item */}
              <div className="w-full h-1.5 rounded-full bg-secondary/70 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', item.colorClass)}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Tỷ lệ hoàn tất thanh toán:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
          {data.find((d) => d.status === 'CONFIRMED')?.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export default BookingStatusBreakdownCard
