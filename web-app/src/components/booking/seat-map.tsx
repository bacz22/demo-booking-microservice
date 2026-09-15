import { useState, useMemo } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, MoveHorizontal } from 'lucide-react'
import { Seat } from '@/components/booking/seat'
import { SeatLegend, type SeatLegendPrices } from '@/components/booking/seat-legend'
import { CinemaScreen } from '@/components/booking/cinema-screen'
import { cn } from '@/lib/utils'
import type { SeatItem, SeatRow, SeatType, SeatStatus } from '@/types/seat'

export interface SeatMapProps {
  /** Danh sách mã các ghế đang được chọn (ví dụ ['C5', 'C6']) */
  selectedSeats?: string[]
  /** Callback khi người dùng click vào một ghế khả dụng */
  onSeatSelect?: (seatNumber: string, seat: SeatItem) => void
  /** Dữ liệu sơ đồ hàng ghế tuỳ chỉnh (nếu không truyền sẽ dùng sơ đồ mặc định) */
  rows?: SeatRow[]
  /** Danh sách ghế đã bán (Occupied / Sold) */
  occupiedSeats?: string[]
  /** Danh sách ghế đang được giữ tạm (Held) */
  heldSeats?: string[]
  /** Bảng giá từng loại ghế hiển thị ở chú thích */
  prices?: SeatLegendPrices
  /** Tên phòng chiếu (tuỳ chọn) */
  roomName?: string
  className?: string
}

const DEFAULT_PRICES: SeatLegendPrices = {
  standard: 75000,
  vip: 95000,
  couple: 180000,
}

const DEFAULT_OCCUPIED = ['B3', 'B4', 'C6', 'D1', 'D2', 'F5-F6']
const DEFAULT_HELD = ['A2', 'E4']

/** Sinh dữ liệu sơ đồ ghế rạp chiếu mặc định chuẩn rạp hiện đại */
function generateDefaultRows(
  occupied: string[] = DEFAULT_OCCUPIED,
  held: string[] = DEFAULT_HELD
): SeatRow[] {
  const rowConfigs: { label: string; type: SeatType; seatCount: number; isCouple?: boolean }[] = [
    { label: 'A', type: 'standard', seatCount: 8 },
    { label: 'B', type: 'standard', seatCount: 8 },
    { label: 'C', type: 'vip', seatCount: 8 },
    { label: 'D', type: 'vip', seatCount: 8 },
    { label: 'E', type: 'vip', seatCount: 8 },
    { label: 'F', type: 'couple', seatCount: 4, isCouple: true }, // Ghế couple ở hàng cuối
  ]

  return rowConfigs.map(({ label, type, seatCount, isCouple }) => {
    const seats: SeatItem[] = []
    const price =
      type === 'couple'
        ? DEFAULT_PRICES.couple
        : type === 'vip'
          ? DEFAULT_PRICES.vip
          : DEFAULT_PRICES.standard

    for (let i = 1; i <= seatCount; i++) {
      const seatNumber = isCouple ? `${label}${i * 2 - 1}-${label}${i * 2}` : `${label}${i}`
      let status: SeatStatus = 'available'

      if (occupied.includes(seatNumber)) {
        status = 'sold'
      } else if (held.includes(seatNumber)) {
        status = 'held'
      }

      seats.push({
        id: `seat-${seatNumber.toLowerCase()}`,
        seatNumber,
        row: label,
        number: i,
        type,
        status,
        price,
      })
    }

    return {
      rowLabel: label,
      type,
      seats,
    }
  })
}

export function SeatMap({
  selectedSeats = [],
  onSeatSelect,
  rows: customRows,
  occupiedSeats = DEFAULT_OCCUPIED,
  heldSeats = DEFAULT_HELD,
  prices = DEFAULT_PRICES,
  roomName,
  className,
}: SeatMapProps) {
  // Mức thu phóng (Zoom level)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const rows = useMemo(() => {
    return customRows ?? generateDefaultRows(occupiedSeats, heldSeats)
  }, [customRows, occupiedSeats, heldSeats])

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.15, 1.3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.15, 0.75))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  return (
    <div
      role="region"
      aria-label="Sơ đồ ghế rạp chiếu phim"
      className={cn(
        'relative flex w-full flex-col items-center gap-6 sm:gap-8 rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-xl',
        className
      )}
    >
      {/* Tiêu đề phòng chiếu nếu có */}
      {roomName && (
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Phòng chiếu:</span>
          <span className="text-foreground">{roomName}</span>
        </div>
      )}

      {/* 1. MÀN HÌNH CHIẾU Ở TRÊN (CinemaScreen) */}
      <div className="w-full">
        <CinemaScreen label="MÀN HÌNH" />
      </div>

      {/* Thanh công cụ điều khiển Zoom & Gợi ý vuốt ngang trên Mobile */}
      <div className="flex w-full items-center justify-between gap-2 border-b border-border/40 pb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:hidden">
          <MoveHorizontal className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span>Vuốt ngang để xem toàn bộ rạp</span>
        </div>

        <div className="hidden sm:block text-xs text-muted-foreground">
          <span>Lối đi ở giữa hàng ghế</span>
        </div>

        {/* Nút điều khiển Zoom */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/40 bg-secondary/60 p-0.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.75}
            aria-label="Thu nhỏ sơ đồ ghế"
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-card disabled:opacity-30"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Đặt lại kích thước sơ đồ ghế"
            className="px-2 py-1 text-[11px] font-medium text-foreground hover:bg-card rounded-md transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 1.3}
            aria-label="Phóng to sơ đồ ghế"
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-colors hover:bg-card disabled:opacity-30"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. GRID GHẾ Ở GIỮA - Hỗ trợ scroll ngang & zoom mà không vỡ layout */}
      <div className="w-full overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 200ms ease-out',
          }}
          className="mx-auto flex min-w-max flex-col items-center gap-2.5 sm:gap-3 px-4 py-2"
        >
          {rows.map((row) => {
            // Chia ghế thành 2 block (Trái và Phải) ngăn cách bởi lối đi (Aisle)
            const midIndex = Math.ceil(row.seats.length / 2)
            const leftSeats = row.seats.slice(0, midIndex)
            const rightSeats = row.seats.slice(midIndex)

            return (
              <div
                key={row.rowLabel}
                className="flex items-center gap-2.5 sm:gap-3"
              >
                {/* Chữ cái hàng ghế (Bên trái) */}
                <span
                  className="w-5 shrink-0 text-center font-bold text-xs sm:text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  {row.rowLabel}
                </span>

                {/* Khối ghế bên trái */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {leftSeats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber)
                    return (
                      <Seat
                        key={seat.seatNumber}
                        seatNumber={seat.seatNumber}
                        type={seat.type}
                        status={seat.status}
                        selected={isSelected}
                        price={seat.price}
                        onSelect={(num) => onSeatSelect?.(num, seat)}
                      />
                    )
                  })}
                </div>

                {/* Khoảng cách lối đi ở giữa rạp (Aisle Gap) */}
                <div
                  className="mx-1 sm:mx-2 flex w-6 sm:w-8 items-center justify-center select-none"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-border/60" />
                </div>

                {/* Khối ghế bên phải */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rightSeats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber)
                    return (
                      <Seat
                        key={seat.seatNumber}
                        seatNumber={seat.seatNumber}
                        type={seat.type}
                        status={seat.status}
                        selected={isSelected}
                        price={seat.price}
                        onSelect={(num) => onSeatSelect?.(num, seat)}
                      />
                    )
                  })}
                </div>

                {/* Chữ cái hàng ghế (Bên phải) */}
                <span
                  className="w-5 shrink-0 text-center font-bold text-xs sm:text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  {row.rowLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. CHÚ THÍCH GHẾ Ở DƯỚI (SeatLegend) */}
      <div className="w-full pt-2">
        <SeatLegend prices={prices} showPrices={true} />
      </div>
    </div>
  )
}

export default SeatMap
