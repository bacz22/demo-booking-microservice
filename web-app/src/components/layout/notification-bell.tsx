import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, CircleCheck, CircleX, Clock, RotateCcw } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  notificationApiService,
  type AppNotification,
  type NotificationType,
} from '@/services/notification-api.service'

const POLL_MS = 15000

const TYPE_ICON: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  BOOKING_CONFIRMED: { icon: CircleCheck, className: 'text-emerald-500' },
  BOOKING_CANCELLED: { icon: CircleX, className: 'text-rose-500' },
  BOOKING_EXPIRED: { icon: Clock, className: 'text-amber-500' },
  PAYMENT_REFUNDED: { icon: RotateCcw, className: 'text-sky-500' },
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

/** Chuông thông báo: badge số chưa đọc (poll 15s) + danh sách mới nhất từ notification-service. */
export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await notificationApiService.getUnreadCount())
    } catch {
      // notification-service chưa chạy → giữ badge cũ, không làm phiền người dùng
    }
  }, [])

  useEffect(() => {
    const first = setTimeout(refreshCount, 0)
    const timer = setInterval(refreshCount, POLL_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [refreshCount])

  const loadList = async () => {
    setLoading(true)
    setError(false)
    try {
      const page = await notificationApiService.getMine(0, 10)
      setItems(page.content)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) void loadList()
  }

  const handleClick = async (n: AppNotification) => {
    if (!n.readAt) {
      try {
        await notificationApiService.markRead(n.id)
        setUnread((c) => Math.max(0, c - 1))
      } catch {
        // bỏ qua: vẫn cho điều hướng
      }
    }
    setOpen(false)
    if (n.bookingId) navigate(`/my-bookings/${n.bookingId}`)
  }

  const handleReadAll = async () => {
    try {
      await notificationApiService.markAllRead()
      const now = new Date().toISOString()
      setItems((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? now })))
      setUnread(0)
    } catch {
      // bỏ qua
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <span className="text-sm font-bold text-foreground">Thông báo</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleReadAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Không tải được thông báo. Vui lòng thử lại sau.
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">Chưa có thông báo nào.</p>
          ) : (
            <ul>
              {items.map((n) => {
                const { icon: Icon, className } = TYPE_ICON[n.type] ?? { icon: Bell, className: 'text-primary' }
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 cursor-pointer',
                        !n.readAt && 'bg-primary/5'
                      )}
                    >
                      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', className)} aria-hidden="true" />
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">{n.title}</span>
                          {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                        <span className="block text-[11px] text-muted-foreground/80">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell
