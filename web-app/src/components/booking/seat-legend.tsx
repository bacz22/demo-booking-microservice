import { Seat } from '@/components/booking/seat'
import { cn } from '@/lib/utils'

export interface SeatLegendPrices {
  standard?: number
  vip?: number
  couple?: number
}

export interface SeatLegendProps {
  /** Bảng giá tuỳ chọn cho từng loại ghế */
  prices?: SeatLegendPrices
  /** Có hiển thị giá cạnh loại ghế không (mặc định false) */
  showPrices?: boolean
  className?: string
}

export function SeatLegend({
  prices,
  showPrices = false,
  className,
}: SeatLegendProps) {
  const formatPrice = (amount?: number) => {
    if (!amount) return ''
    return ` (${amount.toLocaleString('vi-VN')} đ)`
  }

  return (
    <div
      role="region"
      aria-label="Chú thích sơ đồ ghế ngồi"
      className={cn(
        'w-full rounded-2xl border border-border/50 bg-card/60 p-4 sm:p-5 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* 1. Trạng thái ghế (Status) */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Trạng thái ghế
          </span>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Ghế trống */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="standard"
                status="available"
                className="h-6 w-6 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Ghế trống
              </span>
            </div>

            {/* Ghế đang chọn */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="standard"
                status="selected"
                className="h-6 w-6 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Ghế đang chọn
              </span>
            </div>

            {/* Ghế đang giữ */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="standard"
                status="held"
                className="h-6 w-6 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Ghế đang giữ
              </span>
            </div>

            {/* Ghế đã bán */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="standard"
                status="sold"
                className="h-6 w-6 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Ghế đã bán
              </span>
            </div>
          </div>
        </div>

        {/* Đường ngăn cách nhẹ */}
        <div className="h-px w-full bg-border/40" aria-hidden="true" />

        {/* 2. Loại ghế (Types) */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Loại ghế &amp; Hạng phòng
          </span>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Ghế Thường */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="standard"
                status="available"
                className="h-6 w-6 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Ghế Thường
                {showPrices && prices?.standard && (
                  <span className="text-muted-foreground font-normal text-xs">
                    {formatPrice(prices.standard)}
                  </span>
                )}
              </span>
            </div>

            {/* Ghế VIP */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="vip"
                status="available"
                className="h-6 w-6 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-amber-400">
                Ghế VIP
                {showPrices && prices?.vip && (
                  <span className="text-muted-foreground font-normal text-xs">
                    {formatPrice(prices.vip)}
                  </span>
                )}
              </span>
            </div>

            {/* Ghế Đôi (Couple) */}
            <div className="flex items-center gap-2">
              <Seat
                seatNumber=""
                type="couple"
                status="available"
                className="h-6 w-12 pointer-events-none rounded-xs"
              />
              <span className="text-xs sm:text-sm font-medium text-rose-400">
                Ghế Đôi (Couple)
                {showPrices && prices?.couple && (
                  <span className="text-muted-foreground font-normal text-xs">
                    {formatPrice(prices.couple)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeatLegend
