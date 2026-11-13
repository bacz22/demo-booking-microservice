export type AdminPeriod = '7d' | '30d' | 'month'

export interface AdminMetricDelta {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
  isPositive: boolean
}

export interface AdminKPIItem {
  id: string
  label: string
  value: number
  formattedValue: string
  delta?: AdminMetricDelta
  periodLabel: string
  tooltip?: string
  iconName: 'revenue' | 'booking' | 'occupancy' | 'payment_success'
}

export interface RevenueTrendPoint {
  date: string
  label: string
  revenue: number
  bookings: number
}

export type AdminBookingStatusKey =
  | 'CONFIRMED'
  | 'PENDING_PAYMENT'
  | 'CANCELLED'
  | 'EXPIRED'

export interface BookingStatusBreakdown {
  status: AdminBookingStatusKey
  label: string
  count: number
  percentage: number
  colorClass: string
}

export type UpcomingShowtimeStatus = 'PREPARING' | 'BOARDING' | 'PLAYING' | 'CANCELLED'

export interface UpcomingShowtimeItem {
  id: string
  showtimeId: string
  movieTitle: string
  moviePoster?: string
  cinemaName: string
  auditoriumName: string
  format: string
  startTime: string
  dateLabel: string
  soldSeats: number
  /** null khi không lấy được tổng số ghế của phòng */
  totalSeats: number | null
  /** 0..100, null khi không có tổng số ghế */
  occupancyRate: number | null
  status: UpcomingShowtimeStatus
}

export type ActionRequiredType =
  | 'PAYMENT_FAILED'
  | 'PENDING_PAYMENT'
  | 'NEARLY_SOLD_OUT'

export interface ActionRequiredItem {
  id: string
  type: ActionRequiredType
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  timestamp: string
  actionLabel: string
  actionLink: string
  count?: number
}

export interface AdminActivityLogItem {
  id: string
  actorName: string
  actorEmail?: string
  actorRole: string
  action: string
  target: string
  relativeTime: string
  timestamp: string
  iconType?: 'movie' | 'booking' | 'theater' | 'system' | 'security'
}

export interface AdminDashboardData {
  period: AdminPeriod
  lastUpdated: string
  kpis: {
    revenue: AdminKPIItem
    bookings: AdminKPIItem
    seatsSold: AdminKPIItem
    paymentSuccessRate: AdminKPIItem
  }
  trendPoints: RevenueTrendPoint[]
  statusBreakdown: BookingStatusBreakdown[]
  upcomingShowtimes: UpcomingShowtimeItem[]
  actionItems: ActionRequiredItem[]
  activities: AdminActivityLogItem[]
}
