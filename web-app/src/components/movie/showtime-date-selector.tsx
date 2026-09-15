import { useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShowtimeDateItem } from '@/types/showtime'

export interface ShowtimeDateSelectorProps {
  /** Ngày đang được chọn định dạng YYYY-MM-DD */
  selectedDate: string
  /** Callback khi người dùng chọn ngày mới */
  onSelectDate: (date: string) => void
  /** Danh sách ngày tuỳ biến (nếu không truyền sẽ tự động tạo khoảng 7 ngày) */
  dates?: ShowtimeDateItem[]
  /** Ngày bắt đầu để tự sinh (mặc định là hôm nay) */
  startDate?: Date | string
  /** Số ngày hiển thị (mặc định là 7) */
  daysCount?: number
  /** Danh sách các ngày bị disabled định dạng YYYY-MM-DD */
  disabledDates?: string[]
  className?: string
}

const VIETNAMESE_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
]

/** Helper format Date thành chuỗi YYYY-MM-DD theo giờ địa phương */
function formatYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Tự sinh 7 ngày liên tiếp từ ngày bắt đầu */
function generateDefaultDates(
  startDateInput?: Date | string,
  count = 7,
  disabledList: string[] = []
): ShowtimeDateItem[] {
  const start = startDateInput
    ? typeof startDateInput === 'string'
      ? new Date(startDateInput)
      : startDateInput
    : new Date()

  const todayStr = formatYMD(new Date())
  const result: ShowtimeDateItem[] = []

  for (let i = 0; i < count; i++) {
    const cur = new Date(start)
    cur.setDate(start.getDate() + i)

    const dateStr = formatYMD(cur)
    const isToday = dateStr === todayStr
    const weekdayIdx = cur.getDay()

    result.push({
      date: dateStr,
      dayOfWeek: isToday ? 'Hôm nay' : VIETNAMESE_WEEKDAYS[weekdayIdx],
      dayNumber: String(cur.getDate()).padStart(2, '0'),
      month: `Thg ${(cur.getMonth() + 1).toString().padStart(2, '0')}`,
      disabled: disabledList.includes(dateStr),
    })
  }

  return result
}

export function ShowtimeDateSelector({
  selectedDate,
  onSelectDate,
  dates,
  startDate,
  daysCount = 7,
  disabledDates = [],
  className,
}: ShowtimeDateSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Nếu không truyền dates bên ngoài thì tự động sinh 7 ngày
  const dateItems = dates ?? generateDefaultDates(startDate, daysCount, disabledDates)

  // Tự động cuộn ngày được chọn vào giữa tầm nhìn
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const activeItem = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-date="${selectedDate}"]`
    )
    if (activeItem) {
      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [selectedDate])

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === 'left' ? -220 : 220
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' })
    }
  }

  // Điều hướng bằng phím mũi tên Trái / Phải
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        for (let i = currentIndex + 1; i < dateItems.length; i++) {
          if (!dateItems[i].disabled) {
            onSelectDate(dateItems[i].date)
            break
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (!dateItems[i].disabled) {
            onSelectDate(dateItems[i].date)
            break
          }
        }
      }
    },
    [dateItems, onSelectDate]
  )

  return (
    <div
      className={cn('relative w-full select-none', className)}
      aria-label="Bộ chọn ngày chiếu"
    >
      {/* Nút cuộn sang trái trên màn hình desktop */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        aria-label="Cuộn ngày trước đó"
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-secondary hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-hidden"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Danh sách các ngày - Hỗ trợ vuốt chạm ngang trên mobile */}
      <div
        ref={scrollContainerRef}
        role="radiogroup"
        aria-label="Chọn ngày xem phim"
        className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
      >
        {dateItems.map((item, index) => {
          const isSelected = item.date === selectedDate
          const isDisabled = Boolean(item.disabled)

          return (
            <button
              key={item.date}
              type="button"
              role="radio"
              data-date={item.date}
              aria-checked={isSelected}
              aria-label={`${item.dayOfWeek}, ngày ${item.dayNumber} ${item.month}`}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => {
                if (!isDisabled) {
                  onSelectDate(item.date)
                }
              }}
              className={cn(
                'group relative flex min-w-[70px] sm:min-w-[80px] md:min-w-[88px] shrink-0 snap-start flex-col items-center justify-center rounded-xl p-2.5 sm:p-3 transition-all duration-200 outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                // Trạng thái Selected
                isSelected &&
                  'bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 border border-primary scale-[1.03] z-10',
                // Trạng thái Disabled
                isDisabled &&
                  'opacity-35 cursor-not-allowed bg-muted/20 border border-border/20 text-muted-foreground pointer-events-none',
                // Trạng thái Default (Unselected)
                !isSelected &&
                  !isDisabled &&
                  'bg-card/70 hover:bg-secondary/80 border border-border/50 hover:border-border text-foreground hover:scale-[1.02] cursor-pointer'
              )}
            >
              {/* Thứ trong tuần */}
              <span
                className={cn(
                  'text-xs font-medium tracking-wide transition-colors',
                  isSelected
                    ? 'text-primary-foreground/90 font-semibold'
                    : isDisabled
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {item.dayOfWeek}
              </span>

              {/* Số ngày */}
              <span
                className={cn(
                  'my-1 text-xl sm:text-2xl font-bold tracking-tight transition-colors',
                  isSelected
                    ? 'text-primary-foreground font-extrabold'
                    : isDisabled
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                )}
              >
                {item.dayNumber}
              </span>

              {/* Tháng */}
              <span
                className={cn(
                  'text-[11px] font-normal transition-colors',
                  isSelected
                    ? 'text-primary-foreground/80 font-medium'
                    : isDisabled
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground'
                )}
              >
                {item.month}
              </span>

              {/* Chỉ báo viền dưới khi đang chọn */}
              {isSelected && (
                <span
                  className="absolute bottom-1 h-1 w-5 rounded-full bg-primary-foreground/80"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Nút cuộn sang phải trên màn hình desktop */}
      <button
        type="button"
        onClick={() => handleScroll('right')}
        aria-label="Cuộn ngày tiếp theo"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-secondary hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary outline-hidden"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default ShowtimeDateSelector
