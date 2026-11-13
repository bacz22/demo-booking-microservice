/**
 * Loader dữ liệu Dashboard quản trị — ghép từ các API thật:
 * - booking-service: thống kê doanh thu/đơn, số ghế đã bán theo suất, đơn mới nhất
 * - payment-service: tổng hợp giao dịch (tỷ lệ thành công, giao dịch lỗi)
 * - showtime-service: suất chiếu sắp diễn ra
 */
import {
  adminBookingApi,
  adminPaymentApi,
  toVnDate,
  type AdminBookingStats,
  type AdminPaymentSummary,
} from '@/services/admin-api.service'
import { showtimeApiService } from '@/services/showtime-api.service'
import { movieApiService } from '@/services/movie-api.service'
import type { BackendBookingResponse } from '@/types/booking'
import type {
  ActionRequiredItem,
  AdminActivityLogItem,
  AdminBookingStatusKey,
  AdminDashboardData,
  AdminKPIItem,
  AdminMetricDelta,
  AdminPeriod,
  BookingStatusBreakdown,
  RevenueTrendPoint,
  UpcomingShowtimeItem,
  UpcomingShowtimeStatus,
} from '@/types/admin'

const DAY_MS = 24 * 60 * 60 * 1000
const UPCOMING_LIMIT = 6

interface DateRange {
  from: string
  to: string
}

/** Kỳ hiện tại và kỳ liền trước có cùng số ngày (để tính % thay đổi). */
export function getPeriodRanges(period: AdminPeriod, now = new Date()): { current: DateRange; previous: DateRange; days: number } {
  let days: number
  if (period === 'month') {
    // Ngày trong tháng theo giờ VN
    days = Number(toVnDate(now).slice(8, 10))
  } else {
    days = period === '7d' ? 7 : 30
  }
  const start = new Date(now.getTime() - (days - 1) * DAY_MS)
  const prevEnd = new Date(start.getTime() - DAY_MS)
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * DAY_MS)
  return {
    current: { from: toVnDate(start), to: toVnDate(now) },
    previous: { from: toVnDate(prevStart), to: toVnDate(prevEnd) },
    days,
  }
}

const fmtVnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

function delta(current: number, previous: number | null | undefined): AdminMetricDelta | undefined {
  if (previous === null || previous === undefined) return undefined
  if (previous === 0) {
    if (current === 0) return { direction: 'neutral', percentage: 0, isPositive: true }
    return undefined // không có cơ sở so sánh
  }
  const pct = ((current - previous) / previous) * 100
  const rounded = Math.round(Math.abs(pct) * 10) / 10
  if (rounded === 0) return { direction: 'neutral', percentage: 0, isPositive: true }
  return { direction: pct > 0 ? 'up' : 'down', percentage: rounded, isPositive: pct > 0 }
}

const STATUS_META: Record<AdminBookingStatusKey, { label: string; colorClass: string }> = {
  CONFIRMED: { label: 'Đã thanh toán', colorClass: 'bg-emerald-500' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', colorClass: 'bg-amber-500' },
  CANCELLED: { label: 'Đã hủy', colorClass: 'bg-rose-500' },
  EXPIRED: { label: 'Hết hạn giữ chỗ', colorClass: 'bg-slate-400' },
}

const WEEKDAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

function buildTrend(stats: AdminBookingStats): RevenueTrendPoint[] {
  const today = toVnDate(new Date())
  return stats.daily.map((d) => {
    const [y, m, day] = d.date.split('-').map(Number)
    const short = `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}`
    const weekday = d.date === today ? 'Hôm nay' : WEEKDAYS[new Date(y, m - 1, day).getDay()]
    return { date: short, label: `${weekday}, ${short}`, revenue: d.revenue, bookings: d.confirmedBookings }
  })
}

function buildBreakdown(stats: AdminBookingStats): BookingStatusBreakdown[] {
  const keys = Object.keys(STATUS_META) as AdminBookingStatusKey[]
  const total = keys.reduce((sum, k) => sum + (stats.byStatus?.[k] ?? 0), 0)
  return keys.map((k) => {
    const count = stats.byStatus?.[k] ?? 0
    return {
      status: k,
      label: STATUS_META[k].label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      colorClass: STATUS_META[k].colorClass,
    }
  })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Vừa xong'
  if (min < 60) return `${min} phút trước`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))

const BOOKING_ACTION: Record<BackendBookingResponse['status'], string> = {
  CONFIRMED: 'Đặt vé thành công',
  PENDING_PAYMENT: 'Tạo đơn, chờ thanh toán',
  CANCELLED: 'Đơn bị hủy',
  EXPIRED: 'Đơn hết hạn giữ chỗ',
}

function buildActivities(bookings: BackendBookingResponse[]): AdminActivityLogItem[] {
  return bookings.map((b) => ({
    id: b.id,
    actorName: b.bookingCode,
    actorRole: `${b.seats?.length ?? 0} ghế · ${fmtVnd(b.totalAmount)}`,
    action: BOOKING_ACTION[b.status] ?? b.status,
    target: b.movieTitle || b.theaterName || 'Không rõ phim',
    relativeTime: relativeTime(b.updatedAt || b.createdAt),
    timestamp: fmtDateTime(b.updatedAt || b.createdAt),
    iconType: 'booking',
  }))
}

async function loadUpcomingShowtimes(): Promise<UpcomingShowtimeItem[]> {
  const now = new Date()
  const today = toVnDate(now)
  const tomorrow = toVnDate(new Date(now.getTime() + DAY_MS))
  const page = await showtimeApiService.getAdminShowtimes({
    dateFrom: today,
    dateTo: tomorrow,
    sortBy: 'startTime',
    sortOrder: 'asc',
    page: 1,
    pageSize: 50,
  })

  const nowMs = now.getTime()
  const toMs = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime()
  const upcoming = page.items
    .filter((st) => st.status !== 'cancelled' && st.status !== 'ended')
    .filter((st) => toMs(st.date, st.endTime || st.startTime) > nowMs)
    .sort((a, b) => toMs(a.date, a.startTime) - toMs(b.date, b.startTime))
    .slice(0, UPCOMING_LIMIT)
  if (upcoming.length === 0) return []

  const ids = upcoming.map((st) => st.id)
  const missingTitleIds = [...new Set(upcoming.filter((st) => !st.movieTitle).map((st) => st.movieId))]

  const [sold, seatMaps, movies] = await Promise.all([
    adminBookingApi.soldSeats(ids).catch(() => ({}) as Record<string, number>),
    // Tổng số ghế của phòng lấy từ sơ đồ ghế của suất chiếu
    Promise.all(ids.map((id) => showtimeApiService.getPublicShowtimeSeats(id).then((m) => m.totalSeats).catch(() => null))),
    Promise.all(missingTitleIds.map((id) => movieApiService.getMovieById(id).catch(() => null))),
  ])
  const titleById = new Map(movies.filter((m) => m !== null).map((m) => [m.id, m.title]))

  return upcoming.map((st, i) => {
    const soldSeats = sold[st.id] ?? 0
    const totalSeats = seatMaps[i] && seatMaps[i]! > 0 ? seatMaps[i]! : null
    const startMs = toMs(st.date, st.startTime)
    const endMs = toMs(st.date, st.endTime || st.startTime)
    let status: UpcomingShowtimeStatus = 'PREPARING'
    if (nowMs >= startMs && nowMs < endMs) status = 'PLAYING'
    else if (startMs - nowMs <= 30 * 60 * 1000) status = 'BOARDING'
    return {
      id: st.id,
      showtimeId: st.id,
      movieTitle: st.movieTitle || titleById.get(st.movieId) || 'Không rõ phim',
      cinemaName: st.theaterName,
      auditoriumName: st.auditoriumName,
      format: st.format,
      startTime: st.startTime,
      dateLabel: st.date === today ? 'Hôm nay' : st.date === tomorrow ? 'Ngày mai' : st.date,
      soldSeats,
      totalSeats,
      occupancyRate: totalSeats ? Math.round((soldSeats / totalSeats) * 1000) / 10 : null,
      status,
    }
  })
}

function buildActionItems(
  stats: AdminBookingStats,
  payments: AdminPaymentSummary | null,
  upcoming: UpcomingShowtimeItem[]
): ActionRequiredItem[] {
  const items: ActionRequiredItem[] = []
  const nowIso = fmtDateTime(new Date().toISOString())
  const failed = payments?.byStatus?.FAILED?.count ?? 0
  if (failed > 0) {
    items.push({
      id: 'payment-failed',
      type: 'PAYMENT_FAILED',
      title: `${fmtNum(failed)} giao dịch thanh toán thất bại`,
      description: `Tổng giá trị ${fmtVnd(payments?.byStatus?.FAILED?.amount ?? 0)} trong kỳ đang xem.`,
      severity: 'critical',
      timestamp: nowIso,
      actionLabel: 'Xem giao dịch',
      actionLink: '/admin/payments?status=FAILED',
      count: failed,
    })
  }
  const pending = stats.byStatus?.PENDING_PAYMENT ?? 0
  if (pending > 0) {
    items.push({
      id: 'pending-payment',
      type: 'PENDING_PAYMENT',
      title: `${fmtNum(pending)} đơn đang chờ thanh toán`,
      description: 'Ghế đang được giữ; đơn sẽ tự hết hạn nếu khách không thanh toán.',
      severity: 'warning',
      timestamp: nowIso,
      actionLabel: 'Xem đơn',
      actionLink: '/admin/bookings?status=PENDING_PAYMENT',
      count: pending,
    })
  }
  upcoming
    .filter((st) => st.occupancyRate !== null && st.occupancyRate >= 90)
    .forEach((st) => {
      items.push({
        id: `sold-out-${st.id}`,
        type: 'NEARLY_SOLD_OUT',
        title: `Suất ${st.startTime} sắp hết vé`,
        description: `${st.movieTitle} · ${st.cinemaName} (${st.soldSeats}/${st.totalSeats} ghế)`,
        severity: 'info',
        timestamp: nowIso,
        actionLabel: 'Xem suất chiếu',
        actionLink: `/admin/showtimes/${st.showtimeId}/edit`,
      })
    })
  return items
}

export async function loadDashboardData(period: AdminPeriod): Promise<AdminDashboardData> {
  const { current, previous, days } = getPeriodRanges(period)
  const periodLabel = period === 'month' ? 'so với cùng kỳ trước' : `so với ${days} ngày trước`

  const [stats, prevStats, payments, prevPayments, recent, upcoming] = await Promise.all([
    adminBookingApi.stats(current.from, current.to),
    adminBookingApi.stats(previous.from, previous.to).catch(() => null),
    adminPaymentApi.summary(current.from, current.to).catch(() => null),
    adminPaymentApi.summary(previous.from, previous.to).catch(() => null),
    adminBookingApi
      .list({ pageSize: 6, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((p) => p.items)
      .catch(() => [] as BackendBookingResponse[]),
    loadUpcomingShowtimes().catch(() => [] as UpcomingShowtimeItem[]),
  ])

  const successRate = payments?.successRate ?? null
  const prevSuccessRate = prevPayments?.successRate ?? null

  const kpis: AdminDashboardData['kpis'] = {
    revenue: {
      id: 'revenue',
      label: 'Tổng doanh thu',
      value: stats.revenue,
      formattedValue: fmtVnd(stats.revenue),
      delta: delta(stats.revenue, prevStats?.revenue),
      periodLabel,
      tooltip: 'Tổng tiền các đơn đặt vé đã xác nhận thanh toán trong kỳ',
      iconName: 'revenue',
    },
    bookings: {
      id: 'bookings',
      label: 'Đơn đặt vé thành công',
      value: stats.confirmedBookings,
      formattedValue: fmtNum(stats.confirmedBookings),
      delta: delta(stats.confirmedBookings, prevStats?.confirmedBookings),
      periodLabel,
      tooltip: `Số đơn đã xác nhận thanh toán (trên tổng ${fmtNum(stats.createdBookings)} đơn được tạo)`,
      iconName: 'booking',
    },
    seatsSold: {
      id: 'seats-sold',
      label: 'Ghế đã bán',
      value: stats.seatsSold,
      formattedValue: fmtNum(stats.seatsSold),
      delta: delta(stats.seatsSold, prevStats?.seatsSold),
      periodLabel,
      tooltip: 'Tổng số ghế thuộc các đơn đã xác nhận thanh toán trong kỳ',
      iconName: 'occupancy',
    },
    paymentSuccessRate: {
      id: 'payment-success',
      label: 'Tỷ lệ thanh toán thành công',
      value: successRate ?? 0,
      formattedValue: successRate === null ? '—' : `${(successRate * 100).toFixed(1)}%`,
      delta: successRate === null ? undefined : delta(successRate, prevSuccessRate),
      periodLabel: successRate === null ? 'Chưa có giao dịch kết thúc' : periodLabel,
      tooltip: 'Tỷ lệ giao dịch thành công trên tổng giao dịch đã kết thúc (thành công + thất bại)',
      iconName: 'payment_success',
    } satisfies AdminKPIItem,
  }

  return {
    period,
    lastUpdated: fmtDateTime(new Date().toISOString()),
    kpis,
    trendPoints: buildTrend(stats),
    statusBreakdown: buildBreakdown(stats),
    upcomingShowtimes: upcoming,
    actionItems: buildActionItems(stats, payments, upcoming),
    activities: buildActivities(recent),
  }
}
