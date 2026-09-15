import { useState } from 'react'
import { MapPin, Calendar, Clock, Armchair, Film, ReceiptText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { formatPrice, cn } from '@/lib/utils'

export interface BookingSummaryCardProps {
  /** Ảnh poster thumbnail */
  posterUrl: string
  /** Tên bộ phim */
  movieTitle: string
  /** Tên rạp chiếu phim */
  cinemaName: string
  /** Tên phòng chiếu */
  roomName?: string
  /** Ngày chiếu */
  date: string
  /** Suất chiếu */
  showtime: string
  /** Danh sách ghế đã chọn */
  seats: string[]
  /** Đơn giá vé tham chiếu */
  ticketPrice?: number
  /** Tạm tính tiền vé (Subtotal) */
  subtotal?: number
  /** Phí dịch vụ */
  serviceFee?: number
  /** Tổng cộng tiền thanh toán */
  total: number
  /** Định dạng phòng chiếu (ví dụ: "2D", "IMAX") */
  format?: string
  /** Phân loại độ tuổi (ví dụ: "T16", "T18", "P") */
  ageRating?: string
  /** Nút hành động chính (Dùng trong bước Chọn ghế) */
  onContinue?: () => void
  /** Vô hiệu nút hành động */
  continueDisabled?: boolean
  /** Tiêu đề nút hành động */
  continueText?: string
  /** Trạng thái loading của nút hành động */
  loading?: boolean
  className?: string
}

export function BookingSummaryCard({
  posterUrl,
  movieTitle,
  cinemaName,
  roomName = 'Phòng chiếu 02',
  date,
  showtime,
  seats = [],
  ticketPrice,
  subtotal,
  serviceFee = 0,
  total,
  format,
  ageRating,
  onContinue,
  continueDisabled,
  continueText = 'Tiếp tục',
  loading = false,
  className,
}: BookingSummaryCardProps) {
  const [posterError, setPosterError] = useState(false)
  const isButtonDisabled =
    continueDisabled !== undefined ? continueDisabled : seats.length === 0
  const computedSubtotal = subtotal !== undefined ? subtotal : total

  return (
    <article
      aria-label="Thông tin tóm tắt đơn vé"
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-xl backdrop-blur-md',
        className
      )}
    >
      {/* 1. Header: Poster Thumbnail + Tên Phim + Định dạng & Độ tuổi */}
      <div className="flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 border-b border-border/40">
        {/* Poster Thumbnail */}
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-md">
          {!posterError ? (
            <img
              src={posterUrl}
              alt={`Poster phim ${movieTitle}`}
              onError={() => setPosterError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Film className="h-6 w-6" aria-hidden="true" />
            </div>
          )}

          {ageRating && (
            <div className="absolute top-1.5 left-1.5">
              <AgeRatingBadge ageRating={ageRating} size="sm" />
            </div>
          )}
        </div>

        {/* Thông tin phim */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ReceiptText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Thông tin vé</span>
          </div>

          <h2 className="line-clamp-2 text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
            {movieTitle}
          </h2>

          {format && (
            <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Định dạng {format}
            </span>
          )}
        </div>
      </div>

      {/* 2. Chi tiết suất chiếu, rạp và ghế */}
      <div className="space-y-3 p-4 sm:p-5 text-xs sm:text-sm border-b border-border/40">
        {/* Rạp & Phòng chiếu */}
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{cinemaName}</p>
            {roomName && <p className="text-xs text-muted-foreground">{roomName}</p>}
          </div>
        </div>

        {/* Ngày & Suất chiếu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground">{date}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">{showtime}</span>
          </div>
        </div>

        {/* Danh sách ghế đã chọn */}
        <div className="flex items-start gap-2.5 pt-0.5">
          <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-foreground">Ghế đã chọn:</span>
              <span className="text-xs text-muted-foreground font-medium">
                {seats.length > 0 ? `${seats.length} ghế` : 'Chưa chọn'}
              </span>
            </div>

            {seats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {seats.map((seat) => (
                  <span
                    key={seat}
                    className="inline-flex items-center rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary shadow-2xs"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            ) : (
              <p className="pt-1 text-xs text-muted-foreground italic">
                Vui lòng nhấp chọn ghế trên sơ đồ rạp
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bảng phân tích chi phí: Ticket Price, Subtotal, Service Fee, Total */}
      <div className="space-y-2 p-4 sm:p-5 text-xs sm:text-sm bg-secondary/20">
        {ticketPrice !== undefined && ticketPrice > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Đơn giá vé</span>
            <span>{formatPrice(ticketPrice)}</span>
          </div>
        )}

        {/* Tạm tính (Subtotal) nếu có phân tách phí */}
        {subtotal !== undefined && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Tạm tính ({seats.length} vé)</span>
            <span className="font-medium text-foreground">{formatPrice(computedSubtotal)}</span>
          </div>
        )}

        {/* Phí dịch vụ */}
        {serviceFee > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Phí tiện ích</span>
            <span className="font-medium text-foreground">{formatPrice(serviceFee)}</span>
          </div>
        )}

        {/* Đường gạch ngang phân tách tổng */}
        <div className="h-px w-full bg-border/40 my-1" aria-hidden="true" />

        {/* Tổng cộng (Total) */}
        <div className="flex items-baseline justify-between pt-0.5">
          <div>
            <span className="text-sm sm:text-base font-bold text-foreground">
              Tổng thanh toán
            </span>
            <p className="text-xs text-muted-foreground">Đã bao gồm thuế GTGT</p>
          </div>

          <span className="text-xl sm:text-2xl font-black text-primary">
            {formatPrice(total)}
          </span>
        </div>

        {/* 4. CTA Nút Tiếp tục nếu được cung cấp handler */}
        {onContinue && (
          <div className="pt-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={isButtonDisabled || loading}
              onClick={onContinue}
              className="w-full gap-2 font-bold shadow-lg shadow-primary/25 text-base"
            >
              <span>{continueText}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}

export const BookingSummary = BookingSummaryCard
export default BookingSummaryCard
