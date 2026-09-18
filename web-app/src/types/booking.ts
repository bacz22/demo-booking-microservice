export type BookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
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
  expiresAt?: string
  confirmedAt?: string
  cancelledAt?: string
  cancelReason?: string
  showtimeId?: string
  movieId?: string
  theaterId?: string
  auditoriumId?: string
}

// ==========================================
// Backend Booking Service DTOs
// ==========================================

export interface BackendBookingSeatResponse {
  seatId: string
  rowLabel: string
  seatNumber: number
  seatType: string // 'STANDARD' | 'VIP' | 'COUPLE'
  price: number
  status: 'HELD' | 'SOLD' | 'RELEASED'
}

export interface BackendBookingResponse {
  id: string
  bookingCode: string
  requestId: string
  userId: string
  showtimeId: string
  movieId: string
  theaterId: string
  auditoriumId: string
  totalAmount: number
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'
  expiresAt: string // ISO-8601 Instant
  confirmedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  createdAt: string
  seats: BackendBookingSeatResponse[]
}

export interface BackendSeatStatusDto {
  seatId: string
  rowLabel: string
  seatNumber: number
  seatType: 'STANDARD' | 'VIP' | 'COUPLE'
  displayName: string
  status: 'AVAILABLE' | 'HELD' | 'HELD_BY_ME' | 'SOLD'
  remainingSeconds?: number | null
}

export interface BackendSeatAvailabilityResponse {
  showtimeId: string
  serverTime: string
  seats: BackendSeatStatusDto[]
}

export interface CreateBookingRequest {
  showtimeId: string
  seatIds: string[]
}
