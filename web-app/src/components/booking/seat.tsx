import { Check, X, Clock, Ban, Crown, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeatType, SeatStatus } from '@/types/seat'

export interface SeatProps {
  /** Mã số ghế (ví dụ "A1", "C12", "E1-E2") */
  seatNumber: string
  /** Loại ghế: standard | vip | couple (mặc định là standard) */
  type?: SeatType
  /** Trạng thái ghế: available | selected | held | sold | disabled */
  status?: SeatStatus
  /** Trạng thái được chọn (nếu true sẽ ưu tiên trạng thái 'selected') */
  selected?: boolean
  /** Giá vé của ghế (tuỳ chọn) */
  price?: number
  /** Callback khi người dùng click chọn ghế */
  onSelect?: (seatNumber: string) => void
  className?: string
}

const TYPE_LABELS: Record<SeatType, string> = {
  standard: 'Ghế Thường',
  vip: 'Ghế VIP',
  couple: 'Ghế Đôi (Couple)',
}

const STATUS_LABELS: Record<SeatStatus, string> = {
  available: 'Có thể chọn',
  selected: 'Đang chọn',
  held: 'Đang có người giữ',
  sold: 'Đã bán',
  disabled: 'Không khả dụng',
}

export function Seat({
  seatNumber,
  type = 'standard',
  status = 'available',
  selected = false,
  price,
  onSelect,
  className,
}: SeatProps) {
  // Trạng thái thực tế: ưu tiên prop selected
  const effectiveStatus: SeatStatus = selected ? 'selected' : status
  const isClickable = effectiveStatus === 'available' || effectiveStatus === 'selected'

  const typeLabel = TYPE_LABELS[type] || 'Ghế Thường'
  const statusLabel = STATUS_LABELS[effectiveStatus] || 'Có thể chọn'

  const ariaLabel = `Ghế ${seatNumber}, loại ${typeLabel}, trạng thái: ${statusLabel}${
    price ? `, giá ${price.toLocaleString('vi-VN')} đ` : ''
  }`

  const handleClick = () => {
    if (isClickable && onSelect) {
      onSelect(seatNumber)
    }
  }

  return (
    <button
      type="button"
      disabled={!isClickable}
      aria-label={ariaLabel}
      aria-pressed={effectiveStatus === 'selected'}
      aria-disabled={!isClickable}
      title={ariaLabel}
      onClick={handleClick}
      className={cn(
        // Kiểu dáng hình chiếc ghế rạp chiếu phim (phần tựa lưng trên bo cong mềm mại)
        'relative flex flex-col items-center justify-center rounded-t-md rounded-b-xs transition-all duration-150 outline-hidden',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // Invisible hit-area expansion for mobile (>=44px touch target)
        'after:absolute after:-inset-1.5 sm:after:hidden',
        // Kích thước theo loại ghế
        type === 'couple'
          ? 'h-8 sm:h-9 w-18 sm:w-20' // Ghế đôi rộng gấp đôi
          : 'h-8 sm:h-9 w-8 sm:w-9', // Ghế đơn (Standard hoặc VIP)
        // 1. Trạng thái SELECTED (Đang chọn) - Đỏ Crimson rạp chiếu, checkmark, scale nhẹ
        effectiveStatus === 'selected' && [
          'bg-primary text-primary-foreground border-2 border-primary shadow-md shadow-primary/35 scale-105 z-10 font-bold',
        ],
        // 2. Trạng thái SOLD (Đã bán) - Chiếc ghế xám rõ nét với viền sắc sảo và dấu X tương phản cao
        effectiveStatus === 'sold' && [
          'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed pointer-events-none shadow-2xs',
        ],
        // 3. Trạng thái HELD (Đang giữ ghế) - Biểu tượng đồng hồ, màu hổ phách cảnh báo rõ nét
        effectiveStatus === 'held' && [
          'bg-warning/20 border border-warning/60 text-warning cursor-not-allowed pointer-events-none shadow-2xs',
        ],
        // 4. Trạng thái DISABLED (Vô hiệu hoá/bảo trì) - Dấu cấm
        effectiveStatus === 'disabled' && [
          'bg-transparent border border-dashed border-border/30 text-muted-foreground/25 cursor-not-allowed opacity-30 pointer-events-none',
        ],
        // 5. Trạng thái AVAILABLE (Khả dụng) - Phân biệt theo type
        effectiveStatus === 'available' && [
          'cursor-pointer hover:scale-105 active:scale-95 shadow-xs',
          type === 'standard' &&
            'bg-slate-700/80 hover:bg-slate-600/90 border border-slate-500/50 text-slate-200',
          type === 'vip' &&
            'bg-amber-950/80 hover:bg-amber-900/90 border-2 border-amber-500/80 text-amber-300 shadow-amber-500/20',
          type === 'couple' &&
            'bg-rose-950/80 hover:bg-rose-900/90 border-2 border-rose-500/80 text-rose-300 shadow-rose-500/20',
        ],
        className
      )}
    >
      {/* Icon trạng thái (Tuân thủ nguyên tắc: Không chỉ dùng màu sắc để biểu thị trạng thái) */}
      {effectiveStatus === 'selected' ? (
        <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
      ) : effectiveStatus === 'sold' ? (
        <X className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
      ) : effectiveStatus === 'held' ? (
        <Clock className="h-3 w-3" aria-hidden="true" />
      ) : effectiveStatus === 'disabled' ? (
        <Ban className="h-3 w-3" aria-hidden="true" />
      ) : (
        // Trạng thái Available: hiển thị số ghế và biểu tượng đặc trưng của loại ghế
        <div className="flex flex-col items-center justify-center leading-none">
          {type === 'vip' && (
            <Crown className="mb-0.5 h-2 w-2 text-amber-400" aria-hidden="true" />
          )}
          {type === 'couple' && (
            <Heart className="mb-0.5 h-2 w-2 fill-rose-500/40 text-rose-400" aria-hidden="true" />
          )}
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight">
            {seatNumber}
          </span>
        </div>
      )}
    </button>
  )
}

export default Seat
