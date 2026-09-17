import { apiClient } from '@/lib/api-client'
import type {
  AdminShowtime,
  AdminShowtimeStatus,
  ShowtimeFilterState,
  ShowtimeFormData,
  ShowtimePaginationResult,
  ShowtimeTechnologyFormat,
} from '@/types/admin-showtime'
import type { SeatRow, SeatItem, SeatType } from '@/types/seat'
import {
  mapBackendFormatToFrontend,
  type BackendPageResponse,
} from './theater-api.service'

export { mapBackendFormatToFrontend, type BackendPageResponse }

// ==========================================
// Backend DTO Interfaces
// ==========================================

export interface BackendShowtimeResponse {
  id: string
  auditoriumId: string
  auditoriumName: string
  auditoriumFormat?: string
  format?: string
  theaterId: string
  theaterName: string
  theaterAddress: string
  theaterCity: string
  movieId: string
  movieTitle?: string
  movieDurationMin: number
  startTime: string // ISO 8601 UTC Instant: e.g. "2026-09-20T14:30:00Z"
  endTime: string   // ISO 8601 UTC Instant
  cleaningDurationMin: number
  priceStandard: number
  priceVip: number
  priceCouple: number
  status: 'SCHEDULED' | 'SELLING' | 'ENDED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface BackendShowtimeItemResponse {
  id: string
  auditoriumId: string
  auditoriumName: string
  format: string
  startTime: string
  endTime: string
  priceStandard: number
  priceVip: number
  priceCouple: number
  status: 'SCHEDULED' | 'SELLING' | 'ENDED' | 'CANCELLED'
}

export interface BackendMovieShowtimeGroupResponse {
  theaterId: string
  theaterName: string
  address?: string
  theaterAddress?: string
  city?: string
  theaterCity?: string
  showtimes: BackendShowtimeItemResponse[]
}

export interface BackendShowtimeSeatItem {
  id: string
  auditoriumId: string
  seatNumber: string
  rowLabel: string
  seatNumberInRow: number
  type: 'STANDARD' | 'VIP' | 'COUPLE'
  status: 'AVAILABLE' | 'MAINTENANCE'
  price: number
}

export interface BackendShowtimeSeatMapResponse {
  showtimeId: string
  auditoriumId: string
  auditoriumName: string
  format: string
  prices: {
    STANDARD: number
    VIP: number
    COUPLE: number
  }
  totalSeats: number
  seats: BackendShowtimeSeatItem[]
}

// ==========================================
// Date & Time Helpers
// ==========================================

export function isoToLocalDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

export function isoToLocalTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return ''
  }
}

export function combineDateAndTimeToIso(dateStr: string, timeStr: string): string {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  const localDate = new Date(year, month - 1, day, hours, minutes, 0)
  return localDate.toISOString()
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTime(totalMinutes: number): string {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60)
  const h = Math.floor(norm / 60)
  const m = norm % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calculateEndTime(
  startTime: string,
  durationMinutes: number,
  bufferMinutes = 0
): string {
  if (!startTime || !durationMinutes) return startTime || ''
  const startMin = timeToMinutes(startTime)
  return minutesToTime(startMin + durationMinutes + bufferMinutes)
}

// ==========================================
// Status & Format Mappers
// ==========================================

export function mapBackendShowtimeStatusToFrontend(s: string): AdminShowtimeStatus {
  switch (s) {
    case 'SCHEDULED': return 'scheduled'
    case 'SELLING': return 'selling'
    case 'ENDED': return 'ended'
    case 'CANCELLED': return 'cancelled'
    default: return 'scheduled'
  }
}

export function mapFrontendShowtimeStatusToBackend(s: AdminShowtimeStatus): 'SCHEDULED' | 'SELLING' | 'ENDED' | 'CANCELLED' {
  switch (s) {
    case 'scheduled': return 'SCHEDULED'
    case 'selling': return 'SELLING'
    case 'ended': return 'ENDED'
    case 'cancelled': return 'CANCELLED'
    case 'sold-out': return 'SELLING'
    default: return 'SCHEDULED'
  }
}

export function mapBackendShowtimeToAdminShowtime(st: BackendShowtimeResponse): AdminShowtime {
  const date = isoToLocalDate(st.startTime)
  const startTime = isoToLocalTime(st.startTime)
  const endTime = isoToLocalTime(st.endTime)

  return {
    id: st.id,
    movieId: st.movieId,
    movieTitle: st.movieTitle || '',
    moviePosterUrl: '',
    movieDuration: st.movieDurationMin,
    movieAgeRating: 'P',
    theaterId: st.theaterId,
    theaterName: st.theaterName,
    theaterCity: st.theaterCity,
    auditoriumId: st.auditoriumId,
    auditoriumName: st.auditoriumName,
    date,
    startTime,
    endTime,
    cleaningBufferMinutes: st.cleaningDurationMin,
    format: mapBackendFormatToFrontend(st.auditoriumFormat || st.format) as ShowtimeTechnologyFormat,
    language: 'Phụ đề',
    basePrice: st.priceStandard,
    totalSeats: 0,
    bookedSeats: 0,
    affectedBookingsCount: 0,
    status: mapBackendShowtimeStatusToFrontend(st.status),
    createdAt: st.createdAt,
    updatedAt: st.updatedAt,
  }
}

/**
 * Chuyển đổi BackendShowtimeSeatMapResponse thành danh sách hàng ghế (SeatRow[]) cho SeatMap component
 */
export function mapBackendSeatMapToSeatRows(seatMap: BackendShowtimeSeatMapResponse): SeatRow[] {
  const rowMap = new Map<string, SeatItem[]>()

  // Sắp xếp các ghế theo thứ tự: hàng ghế A, B, C... và số thứ tự 1, 2, 3...
  const sortedSeats = [...(seatMap.seats || [])].sort((a, b) => {
    if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel)
    const numA = (a as any).seatNumberInRow ?? (a as any).seatNumber ?? 0
    const numB = (b as any).seatNumberInRow ?? (b as any).seatNumber ?? 0
    return numA - numB
  })

  for (const seat of sortedSeats) {
    if (!rowMap.has(seat.rowLabel)) {
      rowMap.set(seat.rowLabel, [])
    }

    const rawType = ((seat as any).seatType ?? (seat as any).type ?? 'STANDARD').toUpperCase()
    const seatType: SeatType = rawType === 'COUPLE' ? 'couple' : rawType === 'VIP' ? 'vip' : 'standard'
    const seatNum = (seat as any).seatNumberInRow ?? (seat as any).seatNumber ?? 1
    const displayName = (seat as any).displayName || `${seat.rowLabel}${seatNum}`
    const price = (seat as any).price ?? seatMap.prices?.[rawType as keyof typeof seatMap.prices] ?? (seatType === 'couple' ? 180000 : seatType === 'vip' ? 110000 : 90000)

    rowMap.get(seat.rowLabel)!.push({
      id: seat.id,
      seatNumber: displayName,
      row: seat.rowLabel,
      number: seatNum,
      type: seatType,
      status: (seat as any).status === 'MAINTENANCE' ? 'disabled' : 'available',
      price: Number(price),
    })
  }

  return Array.from(rowMap.entries()).map(([rowLabel, seats]) => {
    const primaryType = seats.length > 0 ? seats[0].type : 'standard'
    return {
      rowLabel,
      type: primaryType,
      seats,
    }
  })
}

// ==========================================
// Showtime API Service Class
// ==========================================

export const showtimeApiService = {
  /**
   * Lấy lịch chiếu của phim công khai (nhóm theo từng cụm rạp)
   */
  async getPublicShowtimesForMovie(
    movieId: string,
    params: { date?: string; city?: string; theaterId?: string } = {}
  ): Promise<BackendMovieShowtimeGroupResponse[]> {
    const q = new URLSearchParams()
    if (params.date) q.set('date', params.date)
    if (params.city && params.city !== 'Tất cả') q.set('city', params.city)
    if (params.theaterId) q.set('theaterId', params.theaterId)

    const queryStr = q.toString() ? `?${q.toString()}` : ''
    return apiClient.get<BackendMovieShowtimeGroupResponse[]>(`/movies/${movieId}/showtimes${queryStr}`)
  },

  /**
   * Lấy chi tiết suất chiếu công khai
   */
  async getPublicShowtimeById(id: string): Promise<BackendShowtimeResponse> {
    return apiClient.get<BackendShowtimeResponse>(`/showtimes/${id}`)
  },

  /**
   * Lấy sơ đồ ghế và bảng giá vé theo suất chiếu (phục vụ màn hình chọn ghế)
   */
  async getPublicShowtimeSeats(id: string): Promise<BackendShowtimeSeatMapResponse> {
    return apiClient.get<BackendShowtimeSeatMapResponse>(`/showtimes/${id}/seats`)
  },

  /**
   * Lấy danh sách suất chiếu phân trang cho Admin
   */
  async getAdminShowtimes(filters: Partial<ShowtimeFilterState> = {}): Promise<ShowtimePaginationResult> {
    const params = new URLSearchParams()
    params.set('page', String(filters.page && filters.page > 0 ? filters.page - 1 : 0))
    params.set('pageSize', String(filters.pageSize || 10))
    params.set('size', String(filters.pageSize || 10))

    if (filters.theaterId && filters.theaterId !== 'all') {
      params.set('theaterId', filters.theaterId)
    }
    if (filters.auditoriumId && filters.auditoriumId !== 'all') {
      params.set('auditoriumId', filters.auditoriumId)
    }
    if (filters.movieId && filters.movieId !== 'all') {
      params.set('movieId', filters.movieId)
    }
    if (filters.status && filters.status !== 'all') {
      params.set('status', mapFrontendShowtimeStatusToBackend(filters.status as AdminShowtimeStatus))
    }
    if ((filters as any).date) {
      params.set('date', (filters as any).date)
    }
    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom)
    }
    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo)
    }

    const data = await apiClient.get<BackendPageResponse<BackendShowtimeResponse>>(`/admin/showtimes?${params.toString()}`)
    const rawItems = data.items || data.content || []
    const totalItems = data.total ?? data.totalElements ?? rawItems.length
    const pageSize = data.pageSize ?? data.size ?? filters.pageSize ?? 10

    return {
      items: rawItems.map(mapBackendShowtimeToAdminShowtime),
      totalItems,
      totalPages: data.totalPages ?? 1,
      currentPage: (data.page ?? 0) + 1,
      pageSize,
    }
  },

  /**
   * Xem chi tiết suất chiếu Admin
   */
  async getAdminShowtimeById(id: string): Promise<BackendShowtimeResponse> {
    return apiClient.get<BackendShowtimeResponse>(`/admin/showtimes/${id}`)
  },

  /**
   * Tạo suất chiếu mới (Admin)
   */
  async createShowtime(formData: ShowtimeFormData): Promise<BackendShowtimeResponse> {
    const startTimeIso = combineDateAndTimeToIso(formData.date, formData.startTime)

    // Bảng giá vé mặc định: standard = base, vip = base + 20k, couple = base * 2
    const basePrice = Number(formData.basePrice) || 90000
    const payload = {
      auditoriumId: formData.auditoriumId,
      movieId: formData.movieId,
      startTime: startTimeIso,
      cleaningDurationMin: formData.cleaningBufferMinutes || 15,
      priceStandard: basePrice,
      priceVip: basePrice + 20000,
      priceCouple: basePrice * 2,
    }

    return apiClient.post<BackendShowtimeResponse>('/admin/showtimes', payload)
  },

  /**
   * Cập nhật suất chiếu (Admin - chỉ áp dụng khi ở trạng thái SCHEDULED)
   */
  async updateShowtime(id: string, formData: ShowtimeFormData): Promise<BackendShowtimeResponse> {
    const startTimeIso = combineDateAndTimeToIso(formData.date, formData.startTime)
    const basePrice = Number(formData.basePrice) || 90000

    const payload = {
      startTime: startTimeIso,
      cleaningDurationMin: formData.cleaningBufferMinutes || 15,
      priceStandard: basePrice,
      priceVip: basePrice + 20000,
      priceCouple: basePrice * 2,
    }

    return apiClient.put<BackendShowtimeResponse>(`/admin/showtimes/${id}`, payload)
  },

  /**
   * Chuyển đổi trạng thái suất chiếu theo State Machine (SCHEDULED -> SELLING -> ENDED / CANCELLED)
   */
  async updateShowtimeStatus(
    id: string,
    status: 'SCHEDULED' | 'SELLING' | 'ENDED' | 'CANCELLED'
  ): Promise<BackendShowtimeResponse> {
    return apiClient.patch<BackendShowtimeResponse>(`/admin/showtimes/${id}/status`, { status })
  },

  /**
   * Xóa suất chiếu (chặn xóa nếu đang ở trạng thái SELLING)
   */
  async deleteShowtime(id: string): Promise<void> {
    await apiClient.delete<void>(`/admin/showtimes/${id}`)
  },
}
