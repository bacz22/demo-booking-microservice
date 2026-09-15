export type SeatType = 'standard' | 'vip' | 'couple'

export type SeatStatus = 'available' | 'selected' | 'held' | 'sold' | 'disabled'

export interface SeatItem {
  id?: string
  seatNumber: string
  row?: string
  number?: number
  type: SeatType
  status: SeatStatus
  price?: number
}

export interface SeatRow {
  rowLabel: string
  type: SeatType
  seats: SeatItem[]
}
