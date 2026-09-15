import { cn } from '@/lib/utils'

export interface ShowtimeButtonProps {
  /** ID của suất chiếu (tuỳ chọn) */
  id?: string
  /** Giờ bắt đầu chiếu (ví dụ "10:30", "19:45") */
  startTime: string
  /** Giờ kết thúc chiếu (ví dụ "12:30", tuỳ chọn) */
  endTime?: string
  /** Định dạng phòng chiếu (ví dụ "2D", "3D", "IMAX", "4DX") */
  format?: string
  /** Ngôn ngữ / bản phim (ví dụ "Phụ đề", "Lồng tiếng") */
  language?: string
  /** Số ghế còn trống (tuỳ chọn) */
  remainingSeats?: number
  /** Tổng số ghế của phòng (tuỳ chọn) */
  totalSeats?: number
  /** Trạng thái đang được chọn */
  selected?: boolean
  /** Trạng thái vô hiệu hoá */
  disabled?: boolean
  /** Trạng thái hết vé (Sold out) */
  soldOut?: boolean
  /** Callback khi click vào suất chiếu */
  onClick?: () => void
  className?: string
}

export function ShowtimeButton({
  startTime,
  endTime,
  format = '2D',
  language,
  remainingSeats,
  selected = false,
  disabled = false,
  soldOut = false,
  onClick,
  className,
}: ShowtimeButtonProps) {
  // Trạng thái hết vé: được chỉ định trực tiếp hoặc số ghế còn lại <= 0
  const isSoldOut = Boolean(soldOut || (remainingSeats !== undefined && remainingSeats <= 0))
  // Nút bị disabled nếu bị hết vé hoặc explicitly disabled
  const isDisabled = isSoldOut || Boolean(disabled)

  // Label tiếp cận cho screen readers (WCAG AA)
  const ariaStatus = isSoldOut
    ? 'Hết vé'
    : selected
      ? 'Đang chọn'
      : isDisabled
        ? 'Không khả dụng'
        : 'Có thể chọn'

  const ariaLabel = `Suất chiếu ${startTime}${endTime ? ` đến ${endTime}` : ''}, định dạng ${format}${
    language ? `, ${language}` : ''
  }${
    remainingSeats !== undefined && !isSoldOut ? `, còn ${remainingSeats} ghế trống` : ''
  }, trạng thái: ${ariaStatus}`

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-pressed={selected}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      onClick={() => {
        if (!isDisabled && onClick) {
          onClick()
        }
      }}
      className={cn(
        'group relative flex min-w-[110px] sm:min-w-[124px] flex-col justify-center rounded-xl px-3 py-2 text-left transition-all duration-200 outline-hidden',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // 1. Trạng thái Selected (Đang chọn)
        selected && [
          'bg-primary text-primary-foreground border border-primary shadow-md shadow-primary/25 scale-[1.02] z-10',
        ],
        // 2. Trạng thái Sold Out (Hết vé) - có text rõ ràng và không cho tương tác
        isSoldOut && [
          'bg-card/40 border border-border/30 text-muted-foreground/60 cursor-not-allowed opacity-65',
        ],
        // 3. Trạng thái Disabled (Không hết vé nhưng bị vô hiệu)
        !isSoldOut &&
          disabled && [
            'bg-muted/20 border border-border/30 text-muted-foreground/50 cursor-not-allowed pointer-events-none opacity-40',
          ],
        // 4. Trạng thái Default (Bình thường khả dụng)
        !selected &&
          !isDisabled && [
            'bg-card/80 hover:bg-secondary/90 border border-border/60 hover:border-border text-foreground hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
          ],
        className
      )}
    >
      {/* Dòng trên: Giờ bắt đầu + Format Tag */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'text-base font-bold tracking-tight transition-colors',
              selected
                ? 'text-primary-foreground'
                : isSoldOut
                  ? 'text-muted-foreground/70 line-through decoration-destructive/60'
                  : 'text-foreground group-hover:text-primary'
            )}
          >
            {startTime}
          </span>
          {endTime && (
            <span
              className={cn(
                'text-[10px] font-normal transition-colors',
                selected ? 'text-primary-foreground/80' : 'text-muted-foreground/70'
              )}
            >
              ~{endTime}
            </span>
          )}
        </div>

        {/* Định dạng phòng chiếu (2D, 3D, IMAX...) */}
        {format && (
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
              selected
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : isSoldOut
                  ? 'bg-muted/40 text-muted-foreground/60 border border-border/30'
                  : 'bg-secondary text-muted-foreground border border-border/40 group-hover:text-foreground'
            )}
          >
            {format}
          </span>
        )}
      </div>

      {/* Dòng dưới: Ngôn ngữ / Số ghế còn trống / Text HẾT VÉ rõ ràng */}
      {(language || remainingSeats !== undefined || isSoldOut) && (
        <div className="flex w-full items-center justify-between gap-1.5 pt-1 text-[11px] leading-none">
          {language && (
            <span
              className={cn(
                'truncate font-normal transition-colors',
                selected ? 'text-primary-foreground/85' : 'text-muted-foreground'
              )}
            >
              {language}
            </span>
          )}

          {/* Hiển thị rõ text HẾT VÉ hoặc số ghế */}
          {isSoldOut ? (
            <span className="ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 border border-destructive/20">
              Hết vé
            </span>
          ) : (
            remainingSeats !== undefined && (
              <span
                className={cn(
                  'ml-auto font-medium transition-colors',
                  selected
                    ? 'text-primary-foreground/90'
                    : remainingSeats <= 10
                      ? 'text-amber-500 font-semibold'
                      : 'text-muted-foreground'
                )}
              >
                {remainingSeats} ghế
              </span>
            )
          )}
        </div>
      )}
    </button>
  )
}

export default ShowtimeButton
