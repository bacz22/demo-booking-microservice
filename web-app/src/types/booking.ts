export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'

export interface BookingHistoryItem {
  id?: string
  bookingCode: string
  movieTitle: string
  poster: string
  cinema: string
  room?: string
  showtime: string
  seats: string[]
  total: number
  status: BookingStatus
  createdAt?: string
}
