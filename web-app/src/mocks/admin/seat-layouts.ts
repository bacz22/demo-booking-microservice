import type {
  AdminSeatItem,
  AdminSeatRow,
  AuditoriumSeatLayout,
  SeatLayoutSummary,
  AdminSeatType,
} from '@/types/admin-seat'
import type { AdminAuditorium, AdminTheater } from '@/types/admin-theater'

const STORAGE_LAYOUTS_KEY = 'cinebook_admin_seat_layouts'
const STORAGE_AUDITORIUMS_KEY = 'cinebook_admin_auditoriums'
const STORAGE_THEATERS_KEY = 'cinebook_admin_theaters'

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

/**
 * Khởi tạo sơ đồ ghế mặc định chân thực dựa trên dung lượng và định dạng phòng chiếu
 */
export function generateDefaultLayout(
  auditoriumId: string,
  theaterId: string,
  targetSeats = 120,
  format = '2D'
): AuditoriumSeatLayout {
  // Determine row count and seats per row based on targetSeats and format
  let rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  let seatsPerRow = 14

  if (targetSeats >= 150) {
    rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
    seatsPerRow = 16
  } else if (targetSeats <= 60) {
    // VIP Gold Class
    rowLabels = ['A', 'B', 'C', 'D']
    seatsPerRow = 12
  } else if (format === '4DX') {
    rowLabels = ['A', 'B', 'C', 'D', 'E', 'F']
    seatsPerRow = 16
  }

  const rows: AdminSeatRow[] = rowLabels.map((label, rIdx) => {
    const isFirstRow = rIdx === 0
    const isLastRow = rIdx === rowLabels.length - 1
    const isVipRow = rIdx >= 2 && rIdx <= rowLabels.length - 2

    const seats: AdminSeatItem[] = []

    if (isLastRow) {
      // Last row has couple seats
      const coupleCount = Math.floor(seatsPerRow / 2)
      for (let c = 1; c <= coupleCount; c++) {
        const c1 = c * 2 - 1
        const c2 = c * 2
        const isAisle = c === Math.floor(coupleCount / 2)

        seats.push({
          id: `seat-${auditoriumId}-${label}${c1}-${label}${c2}`.toLowerCase(),
          seatNumber: `${label}${c1}-${label}${c2}`,
          row: label,
          col: c,
          type: 'couple',
          status: 'available',
          isAisleAfter: isAisle,
        })
      }
    } else {
      for (let col = 1; col <= seatsPerRow; col++) {
        let type: AdminSeatType = 'standard'
        if (isVipRow) {
          type = 'vip'
        } else if (isFirstRow && (col === 1 || col === seatsPerRow)) {
          // Priority / accessibility seats at the front edges
          type = 'accessibility'
        }

        // Place aisles naturally around 1/4 and 3/4 or middle
        const isAisle = col === 4 || col === seatsPerRow - 4

        seats.push({
          id: `seat-${auditoriumId}-${label}${col}`.toLowerCase(),
          seatNumber: `${label}${col}`,
          row: label,
          col,
          type,
          status: 'available',
          isAisleAfter: isAisle,
        })
      }
    }

    return {
      rowLabel: label,
      seats,
    }
  })

  return {
    auditoriumId,
    theaterId,
    rows,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

/**
 * Lấy sơ đồ ghế của một phòng chiếu (tải từ localStorage hoặc sinh mặc định)
 */
export async function getSeatLayoutByAuditoriumId(
  auditoriumId: string,
  theaterId: string,
  fallbackSeats = 120,
  format = '2D'
): Promise<AuditoriumSeatLayout> {
  await new Promise((res) => setTimeout(res, 120))

  try {
    const raw = localStorage.getItem(STORAGE_LAYOUTS_KEY)
    if (raw) {
      const layouts: AuditoriumSeatLayout[] = JSON.parse(raw)
      const found = layouts.find((l) => l.auditoriumId === auditoriumId)
      if (found) return found
    }
  } catch (err) {
    console.error('Error reading seat layouts from localStorage:', err)
  }

  // Generate and save default layout if none exists
  const defaultLayout = generateDefaultLayout(
    auditoriumId,
    theaterId,
    fallbackSeats,
    format
  )
  saveLayoutToStorage(defaultLayout)
  return defaultLayout
}

function saveLayoutToStorage(layout: AuditoriumSeatLayout) {
  try {
    const raw = localStorage.getItem(STORAGE_LAYOUTS_KEY)
    const layouts: AuditoriumSeatLayout[] = raw ? JSON.parse(raw) : []
    const idx = layouts.findIndex((l) => l.auditoriumId === layout.auditoriumId)
    if (idx !== -1) {
      layouts[idx] = layout
    } else {
      layouts.push(layout)
    }
    localStorage.setItem(STORAGE_LAYOUTS_KEY, JSON.stringify(layouts))
  } catch (err) {
    console.error('Failed to save layout to storage:', err)
  }
}

/**
 * Lưu sơ đồ ghế và tự động đồng bộ lại tổng số ghế (totalSeats) cho phòng chiếu và cụm rạp
 */
export async function saveAuditoriumSeatLayout(
  layout: AuditoriumSeatLayout
): Promise<{ totalSeats: number }> {
  await new Promise((res) => setTimeout(res, 200))

  // Calculate actual totalSeats from layout
  const summary = calculateLayoutSummary(layout.rows)
  const newTotalSeats = summary.totalSeats

  // 1. Save layout
  saveLayoutToStorage({
    ...layout,
    updatedAt: new Date().toISOString().slice(0, 10),
  })

  // 2. Sync with Auditorium
  try {
    const rawAuds = localStorage.getItem(STORAGE_AUDITORIUMS_KEY)
    if (rawAuds) {
      const auds: AdminAuditorium[] = JSON.parse(rawAuds)
      const targetAud = auds.find((a) => a.id === layout.auditoriumId)
      if (targetAud) {
        targetAud.totalSeats = newTotalSeats
        targetAud.updatedAt = new Date().toISOString().slice(0, 10)
        localStorage.setItem(STORAGE_AUDITORIUMS_KEY, JSON.stringify(auds))
      }

      // 3. Sync with Theater totalSeats
      const rawTheaters = localStorage.getItem(STORAGE_THEATERS_KEY)
      if (rawTheaters) {
        const theaters: AdminTheater[] = JSON.parse(rawTheaters)
        const targetTheater = theaters.find((t) => t.id === layout.theaterId)
        if (targetTheater) {
          const theaterAuds = auds.filter((a) => a.theaterId === layout.theaterId)
          targetTheater.totalSeats = theaterAuds.reduce(
            (sum, a) => sum + a.totalSeats,
            0
          )
          targetTheater.updatedAt = new Date().toISOString().slice(0, 10)
          localStorage.setItem(STORAGE_THEATERS_KEY, JSON.stringify(theaters))
        }
      }
    }
  } catch (err) {
    console.error('Error syncing totalSeats after saving layout:', err)
  }

  return { totalSeats: newTotalSeats }
}
