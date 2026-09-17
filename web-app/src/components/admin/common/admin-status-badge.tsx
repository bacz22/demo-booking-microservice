import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Film,
  PlayCircle,
  Info,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type BadgeVariantType =
  // Movie status
  | 'now-showing'
  | 'coming-soon'
  | 'ended'
  // Theater and Auditorium status
  | 'active'
  | 'maintenance'
  | 'inactive'
  // Booking & Payment status
  | 'CONFIRMED'
  | 'PENDING_PAYMENT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  // User status
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'LOCKED'
  // Showtime status
  | 'selling'
  | 'sold-out'
  | 'PREPARING'
  | 'BOARDING'
  | 'PLAYING'
  | 'cancelled'
  // General severity
  | 'critical'
  | 'warning'
  | 'info'
  | 'success'

interface AdminStatusBadgeProps {
  status: BadgeVariantType | string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function AdminStatusBadge({
  status,
  label,
  className,
  size = 'md',
}: AdminStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      // Movie Statuses
      case 'now-showing':
        return {
          icon: Film,
          defaultLabel: 'Đang chiếu',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'coming-soon':
        return {
          icon: Sparkles,
          defaultLabel: 'Sắp chiếu',
          className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        }
      case 'ended':
        return {
          icon: Clock,
          defaultLabel: 'Ngừng chiếu',
          className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        }

      // Theater & Auditorium Statuses
      case 'active':
      case 'ACTIVE':
        return {
          icon: CheckCircle2,
          defaultLabel: 'Hoạt động',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'maintenance':
        return {
          icon: Wrench,
          defaultLabel: 'Bảo trì',
          className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      case 'inactive':
        return {
          icon: XCircle,
          defaultLabel: 'Tạm ngưng',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'SUSPENDED':
        return {
          icon: AlertTriangle,
          defaultLabel: 'Tạm đình chỉ',
          className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      case 'LOCKED':
        return {
          icon: XCircle,
          defaultLabel: 'Đã khóa',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }

      // Booking Statuses
      case 'CONFIRMED':
        return {
          icon: CheckCircle2,
          defaultLabel: 'Đã thanh toán',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'PENDING_PAYMENT':
        return {
          icon: Clock,
          defaultLabel: 'Chờ thanh toán',
          className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      case 'CANCELLED':
        return {
          icon: XCircle,
          defaultLabel: 'Đã hủy',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'EXPIRED':
        return {
          icon: Clock,
          defaultLabel: 'Hết hạn',
          className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        }
      case 'REFUND_PENDING':
        return {
          icon: RotateCcw,
          defaultLabel: 'Chờ hoàn tiền',
          className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        }
      case 'REFUNDED':
        return {
          icon: RotateCcw,
          defaultLabel: 'Đã hoàn tiền',
          className: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        }
      case 'SUCCESS':
        return {
          icon: CheckCircle2,
          defaultLabel: 'Thành công',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'PENDING':
        return {
          icon: Clock,
          defaultLabel: 'Chờ xử lý',
          className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      case 'FAILED':
        return {
          icon: XCircle,
          defaultLabel: 'Thất bại',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }

      // Showtime Statuses
      case 'scheduled':
      case 'SCHEDULED':
        return {
          icon: Clock,
          defaultLabel: 'Đã lên lịch',
          className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        }
      case 'selling':
      case 'SELLING':
        return {
          icon: Sparkles,
          defaultLabel: 'Đang mở bán',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }
      case 'sold-out':
        return {
          icon: AlertTriangle,
          defaultLabel: 'Hết vé',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'ended':
      case 'ENDED':
        return {
          icon: Clock,
          defaultLabel: 'Đã kết thúc',
          className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        }
      case 'cancelled':
      case 'CANCELLED':
        return {
          icon: XCircle,
          defaultLabel: 'Đã hủy',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'BOARDING':
        return {
          icon: PlayCircle,
          defaultLabel: 'Đang soát vé',
          className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse',
        }
      case 'PREPARING':
        return {
          icon: Clock,
          defaultLabel: 'Chuẩn bị chiếu',
          className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        }
      case 'PLAYING':
        return {
          icon: Film,
          defaultLabel: 'Đang chiếu',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }

      // Severities
      case 'critical':
        return {
          icon: AlertTriangle,
          defaultLabel: 'Nghiêm trọng',
          className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          defaultLabel: 'Cảnh báo',
          className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        }
      case 'info':
        return {
          icon: Info,
          defaultLabel: 'Thông tin',
          className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        }
      case 'success':
        return {
          icon: CheckCircle2,
          defaultLabel: 'Thành công',
          className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        }

      default:
        return {
          icon: Info,
          defaultLabel: status,
          className: 'bg-secondary text-secondary-foreground border-border/60',
        }
    }
  }

  const config = getBadgeConfig()
  const IconComponent = config.icon
  const displayLabel = label || config.defaultLabel

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-lg border leading-none',
        size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs',
        config.className,
        className
      )}
    >
      <IconComponent className={cn('shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  )
}

export default AdminStatusBadge
