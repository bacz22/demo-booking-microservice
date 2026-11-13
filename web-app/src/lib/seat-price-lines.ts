import type { SeatPriceLine } from '@/components/booking/booking-summary-card'

const LABELS: Record<string, string> = {
  STANDARD: 'Ghế thường',
  VIP: 'Ghế VIP',
  COUPLE: 'Ghế đôi',
}

/**
 * Gom ghế đã chọn theo loại để hiển thị đơn giá đúng từng loại
 * (thay cho một "đơn giá" chung vốn chỉ đúng với ghế thường).
 */
export function seatPriceLines(seats: Array<{ type?: string; seatType?: string; price?: number | null }>): SeatPriceLine[] {
  const groups = new Map<string, SeatPriceLine>()
  for (const seat of seats) {
    const type = String(seat.seatType ?? seat.type ?? 'STANDARD').toUpperCase()
    const price = Number(seat.price ?? 0)
    if (!price) continue
    const key = `${type}:${price}`
    const line = groups.get(key)
    if (line) line.count += 1
    else groups.set(key, { label: LABELS[type] ?? type, count: 1, price })
  }
  return [...groups.values()]
}
