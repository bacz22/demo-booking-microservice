export type AdminBookingStatus =
  | 'CONFIRMED'
  | 'PENDING_PAYMENT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUND_PENDING'
  | 'REFUNDED'

export type AdminPaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED'

export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CREDIT_CARD'

export interface BookingCustomer {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  membershipTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'STANDARD'
}

export interface BookingMovieSnapshot {
  id: string
  title: string
  posterUrl: string
  duration: number
  ageRating: string
  format: string
  language: string
}

export interface BookingTheaterSnapshot {
  id: string
  name: string
  city: string
  address: string
  auditoriumId: string
  auditoriumName: string
}

export interface BookingSeatItem {
  seatId: string
  seatNumber: string
  type: 'standard' | 'vip' | 'couple' | 'accessibility'
  price: number
}

export interface BookingPricingBreakdown {
  seatsTotal: number
  comboSnackTotal: number
  discountAmount: number
  finalTotal: number
}

export interface BookingStateTransition {
  id: string
  fromState?: AdminBookingStatus
  toState: AdminBookingStatus
  title: string
  description: string
  timestamp: string
  actor: 'USER' | 'SYSTEM' | 'ADMIN'
  correlationId?: string
}

export interface BookingTechnicalMetadata {
  bookingId: string
  userId: string
  showtimeId: string
  paymentId: string
  providerRef: string
  correlationId: string
  kafkaTopic: string
  kafkaPartition: number
  kafkaOffset: number
  userAgent: string
  ipAddress: string
}

export interface AdminBooking {
  id: string
  bookingCode: string // e.g. CB-849201
  customer: BookingCustomer
  movie: BookingMovieSnapshot
  theater: BookingTheaterSnapshot
  showtime: {
    id: string
    date: string // YYYY-MM-DD
    startTime: string // HH:mm
    endTime: string // HH:mm
  }
  seats: BookingSeatItem[]
  pricing: BookingPricingBreakdown
  payment: {
    paymentId: string
    method: PaymentMethod
    status: AdminPaymentStatus
    providerRef: string
    paidAt?: string
  }
  status: AdminBookingStatus
  timeline: BookingStateTransition[]
  metadata: BookingTechnicalMetadata
  createdAt: string
  updatedAt: string
}

export interface BookingFilterState {
  search: string
  status: 'ALL' | AdminBookingStatus
  paymentStatus: 'ALL' | AdminPaymentStatus
  movieId: string
  theaterId: string
  startDate: string
  endDate: string
  page: number
  pageSize: number
  sortBy: 'createdAt' | 'finalTotal' | 'showtimeDate'
  sortOrder: 'asc' | 'desc'
}

export interface BookingPaginationResult {
  data: AdminBooking[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
