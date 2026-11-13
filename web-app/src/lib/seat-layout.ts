import type { AdminSeatRow, SeatLayoutSummary } from '@/types/admin-seat'

/**
 * Tính toán các chỉ số tóm tắt của sơ đồ ghế
 */
export function calculateLayoutSummary(rows: AdminSeatRow[]): SeatLayoutSummary {
  let standardCount = 0
  let vipCount = 0
  let coupleCount = 0
  let accessibilityCount = 0
  let disabledCount = 0
  let totalCapacity = 0

  rows.forEach((row) => {
    row.seats.forEach((seat) => {
      if (seat.status === 'disabled') {
        disabledCount++
      }

      switch (seat.type) {
        case 'standard':
          standardCount++
          if (seat.status !== 'disabled') totalCapacity += 1
          break
        case 'vip':
          vipCount++
          if (seat.status !== 'disabled') totalCapacity += 1
          break
        case 'couple':
          coupleCount++
          // Ghế đôi phục vụ 2 người
          if (seat.status !== 'disabled') totalCapacity += 2
          break
        case 'accessibility':
          accessibilityCount++
          if (seat.status !== 'disabled') totalCapacity += 1
          break
      }
    })
  })

  return {
    totalRows: rows.length,
    totalSeats: totalCapacity,
    standardCount,
    vipCount,
    coupleCount,
    accessibilityCount,
    disabledCount,
  }
}
