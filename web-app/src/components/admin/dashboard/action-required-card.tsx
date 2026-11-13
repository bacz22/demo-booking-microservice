import { Link } from 'react-router-dom'
import { AlertOctagon, ArrowRight } from 'lucide-react'
import type { ActionRequiredItem } from '@/types/admin'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActionRequiredCardProps {
  items: ActionRequiredItem[]
  className?: string
}

export function ActionRequiredCard({ items, className }: ActionRequiredCardProps) {
  const criticalCount = items.filter((i) => i.severity === 'critical').length

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
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              <span>Vấn Đề Cần Xử Lý Ngay</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Giao dịch lỗi, đơn chờ thanh toán và suất chiếu sắp hết vé
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {criticalCount} khẩn cấp
              </span>
            )}
          </div>
        </div>

        {/* Action Items List */}
        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">Không có việc nào cần xử lý.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'group relative rounded-xl border p-3.5 transition-all duration-150',
                item.severity === 'critical'
                  ? 'border-rose-500/30 bg-rose-500/[0.03] hover:bg-rose-500/[0.06] hover:border-rose-500/50'
                  : item.severity === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] hover:border-amber-500/50'
                  : 'border-border/60 bg-secondary/30 hover:bg-secondary/60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AdminStatusBadge status={item.severity} size="sm" />
                    <span className="text-xs font-bold text-foreground">
                      {item.title}
                    </span>
                    {item.count !== undefined && (
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-secondary text-foreground">
                        x{item.count}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  <span className="text-[10px] text-muted-foreground/70 block pt-0.5">
                    Phát hiện: {item.timestamp}
                  </span>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    'shrink-0 h-8 text-xs font-semibold rounded-lg gap-1 cursor-pointer self-center',
                    item.severity === 'critical'
                      ? 'border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                      : 'border-border/70 hover:bg-secondary'
                  )}
                >
                  <Link to={item.actionLink}>
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Tổng số vấn đề đang mở:</span>
        <span className="font-bold text-foreground font-mono">{items.length} cảnh báo</span>
      </div>
    </div>
  )
}

export default ActionRequiredCard
