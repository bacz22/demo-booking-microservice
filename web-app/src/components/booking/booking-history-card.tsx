import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  Ban,
  Hourglass,
  XCircle,
  MapPin,
  Calendar,
  Armchair,
  Film,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types/booking'

export interface BookingHistoryCardProps {
  /** Mã đặt vé (ví dụ: CB-849201) */
  bookingCode: string
  /** Tên bộ phim */
  movieTitle: string
  /** URL ảnh poster phim */
  poster: string
  /** Tên rạp chiếu phim */
  cinema: string
  /** Suất chiếu và ngày chiếu */
  showtime: string
  /** Danh sách ghế đã đặt */
  seats: string[]
  /** Tổng tiền thanh toán */
  total: number
  /** Trạng thái đơn đặt vé: PENDING | CONFIRMED | CANCELLED | EXPIRED | PAYMENT_FAILED */
  status: BookingStatus
  /** Tên phòng chiếu (tuỳ chọn) */
  room?: string
  /** Đường dẫn chi tiết vé (mặc định: /my-bookings/:bookingCode) */
  href?: string
  /** Callback khi click vào thẻ vé */
  onClick?: () => void
  className?: string
}

interface StatusConfig {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const STATUS_CONFIG: Record<BookingStatus, StatusConfig> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Chờ thanh toán',
    className: 'bg-warning/15 text-warning border-warning/30',
    icon: Clock,
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-muted text-muted-foreground border-border/50',
    icon: Ban,
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'bg-warning/15 text-warning border-warning/30',
    icon: Hourglass,
  },
  PAYMENT_FAILED: {
    label: 'Thanh toán thất bại',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: XCircle,
  },
}

export function BookingHistoryCard({
  bookingCode,
  movieTitle,
  poster,
  cinema,
  showtime,
  seats = [],
  total,
  status = 'CONFIRMED',
  room,
  href,
  onClick,
  className,
}: BookingHistoryCardProps) {
  const [posterError, setPosterError] = useState(false)
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.CONFIRMED
  const StatusIcon = statusConfig.icon

  return (
    <article
      aria-label={`Vé xem phim ${movieTitle}, mã ${bookingCode}, trạng thái: ${statusConfig.label}`}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border/60 bg-card/85 p-4 sm:p-5 gap-4 sm:gap-5 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-primary/5 backdrop-blur-sm',
        className
      )}
    >
      {/* 1. Poster Thumbnail (Chuẩn tỉ lệ 2:3) */}
      <div className="relative h-44 w-32 sm:h-36 sm:w-24 shrink-0 mx-auto sm:mx-0 overflow-hidden rounded-xl border border-border/50 bg-card shadow-md">
        {!posterError ? (
          <img
            src={poster}
            alt={`Poster phim ${movieTitle}`}
            onError={() => setPosterError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Film className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* 2. Chi tiết thông tin vé */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Hàng trên: Mã đặt vé & Badge trạng thái (Text + Color rõ ràng) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Mã vé: <span className="text-foreground">{bookingCode}</span>
            </span>

            {/* Badge Trạng Thái theo đặc tả: Có cả text và màu sắc ngữ nghĩa rõ nét */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs',
                statusConfig.className
              )}
            >
              <StatusIcon className="h-3.5 w-3.5 stroke-[2.2]" aria-hidden="true" />
              <span>{statusConfig.label}</span>
            </span>
          </div>

          {/* Tên phim */}
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {movieTitle}
          </h3>

          {/* Metadata: Rạp, Suất chiếu, Ghế */}
          <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="truncate">
                {cinema}
                {room ? ` • ${room}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
              <span>{showtime}</span>
            </div>

            <div className="flex items-center gap-2">
              <Armchair className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
              <span>
                Ghế:{' '}
                <strong className="text-foreground font-semibold">
                  {seats.join(', ')}
                </strong>{' '}
                <span className="text-xs">({seats.length} vé)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Hàng dưới: Tổng tiền & Nút Xem chi tiết vé */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground block">Tổng tiền</span>
            <span className="text-base sm:text-lg font-black text-primary">
              {total.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <Link
            to={href || `/my-bookings/${bookingCode}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors rounded-lg bg-secondary/80 hover:bg-secondary px-3.5 py-2 border border-border/50 shadow-2xs"
          >
            <span>Chi tiết vé</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default BookingHistoryCard
