export type AdminSeatType = 'standard' | 'vip' | 'couple' | 'accessibility'
export type AdminSeatStatus = 'available' | 'disabled'

export interface AdminSeatItem {
  id: string
  seatNumber: string // Ví dụ: "A1", "C5", "F1-F2"
  row: string // "A", "B", "C"...
  col: number // 1, 2, 3...
  type: AdminSeatType
  status: AdminSeatStatus
  isAisleAfter?: boolean // Đánh dấu khoảng trống/lối đi sau chiếc ghế này
}

export interface AdminSeatRow {
  rowLabel: string
  seats: AdminSeatItem[]
}

export interface AuditoriumSeatLayout {
  auditoriumId: string
  theaterId: string
  rows: AdminSeatRow[]
  updatedAt: string
}

export interface SeatLayoutSummary {
  totalRows: number
  totalSeats: number // Mỗi ghế couple tính là 2 vé, standard/vip/accessibility tính là 1; ghế disabled không tính vào công suất bán vé
  standardCount: number
  vipCount: number
  coupleCount: number
  accessibilityCount: number
  disabledCount: number
}
