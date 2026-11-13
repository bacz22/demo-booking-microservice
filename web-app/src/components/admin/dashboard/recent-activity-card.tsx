import { Link } from 'react-router-dom'
import {
  History,
  Film,
  Ticket,
  Building2,
  Cpu,
  UserCheck,
} from 'lucide-react'
import type { AdminActivityLogItem } from '@/types/admin'
import { cn } from '@/lib/utils'

interface RecentActivityCardProps {
  activities: AdminActivityLogItem[]
  className?: string
}

export function RecentActivityCard({ activities, className }: RecentActivityCardProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-3.5 h-3.5 text-primary" />
      case 'booking':
        return <Ticket className="w-3.5 h-3.5 text-emerald-500" />
      case 'theater':
        return <Building2 className="w-3.5 h-3.5 text-amber-500" />
      case 'system':
        return <Cpu className="w-3.5 h-3.5 text-sky-500" />
      default:
        return <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
    }
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
              <History className="w-5 h-5 text-primary" />
              <span>Hoạt Động Gần Đây</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Các đơn đặt vé mới nhất trên hệ thống
            </p>
          </div>

          <span className="text-xs font-semibold text-muted-foreground font-mono">
            {activities.length} đơn
          </span>
        </div>

        {/* Activity Timeline List */}
        <div className="mt-4 space-y-3.5">
          {activities.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">Chưa có đơn đặt vé nào.</p>
          )}
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 text-xs">
              {/* Icon avatar / pill */}
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center border border-border/60 shrink-0 mt-0.5">
                {getIcon(act.iconType)}
              </div>

              {/* Detail content */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-foreground truncate max-w-[150px]">
                      {act.actorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground px-1 py-0.2 rounded bg-secondary">
                      {act.actorRole}
                    </span>
                  </div>

                  <span
                    className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0"
                    title={act.timestamp}
                  >
                    {act.relativeTime}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground/90 font-medium">{act.action}</span>:{' '}
                  <span className="font-semibold text-primary/90">{act.target}</span>
                </p>

                <p className="text-[10px] text-muted-foreground/60 font-mono">
                  {act.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Nguồn: Booking Service</span>
        <Link to="/admin/bookings" className="font-semibold text-primary hover:underline">
          Xem tất cả đơn
        </Link>
      </div>
    </div>
  )
}

export default RecentActivityCard
