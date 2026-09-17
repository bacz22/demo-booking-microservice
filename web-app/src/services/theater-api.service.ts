import { apiClient } from '@/lib/api-client'
import type {
  AdminTheater,
  AdminAuditorium,
  AdminTheaterStatus,
  AuditoriumFormat,
  AuditoriumStatus,
  TheaterFilterState,
  TheaterPaginationResult,
  TheaterFormData,
  AuditoriumFormData,
} from '@/types/admin-theater'
import type {
  AdminSeatRow,
  AdminSeatItem,
  AdminSeatType,
} from '@/types/admin-seat'

export const DEFAULT_THEATER_FEATURES = [
  'IMAX Laser',
  '4DX Dynamic',
  'ScreenX 270°',
  'Dolby Atmos',
  'Ghế Sweetbox Đôi',
  'VIP Lounge Chờ',
  'Bãi Đỗ Xe Ô Tô',
  'Bãi Đỗ Xe Máy',
  'Quầy Bắp Nước Cao Cấp',
  'Lối Đi Người Khuyết Tật',
  'Máy Bán Vé Tự Động',
]

export const DEFAULT_POPULAR_CITIES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Khánh Hòa',
  'Bình Dương',
  'Đồng Nai',
  'Quảng Ninh',
  'Huế',
]

// ==========================================
// Backend DTO Interfaces
// ==========================================

export interface BackendTheaterResponse {
  id: string
  name: string
  address: string
  city: string
  hotline: string
  openingHours: string
  features: string[]
  imageUrl: string
  status: 'ACTIVE' | 'INACTIVE'
  totalRooms: number
  totalSeats: number
  createdAt: string
  updatedAt: string
}

export interface BackendAuditoriumResponse {
  id: string
  theaterId: string
  name: string
  format: string // '2D' | '3D' | 'IMAX_LASER' | '4DX' | 'SCREENX' | 'DOLBY_ATMOS'
  totalSeats: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface BackendTheaterDetailResponse extends BackendTheaterResponse {
  auditoriums: BackendAuditoriumResponse[]
}

export interface BackendPageResponse<T> {
  items?: T[]
  content?: T[]
  total?: number
  totalElements?: number
  page: number
  pageSize?: number
  size?: number
  totalPages: number
  first?: boolean
  last?: boolean
}

export interface BackendSeatResponse {
  id: string
  auditoriumId: string
  rowLabel: string
  seatNumber: number
  seatType: 'STANDARD' | 'VIP' | 'COUPLE' | string
  displayName?: string
}

export interface BackendSeatLayoutResponse {
  auditoriumId: string
  auditoriumName: string
  totalSeats: number
  seats: BackendSeatResponse[]
}

export interface SeatGenerateRowConfig {
  label: string
  seatCount: number
  seatType: 'STANDARD' | 'VIP' | 'COUPLE'
}

export interface SeatGeneratePayload {
  rows: SeatGenerateRowConfig[]
}

// ==========================================
// Mappers & Converters
// ==========================================

export function mapBackendFormatToFrontend(f?: string): AuditoriumFormat {
  if (!f) return '2D'
  const normalized = f.trim().replace(/-/g, '_').replace(/\s+/g, '_').toUpperCase()
  switch (normalized) {
    case 'IMAX_LASER':
    case 'IMAX':
      return 'IMAX Laser'
    case 'SCREENX':
      return 'ScreenX'
    case 'DOLBY_ATMOS':
    case 'DOLBY':
      return 'Dolby Atmos'
    case 'THREE_D':
    case '3D':
      return '3D'
    case 'FOUR_DX':
    case '4DX':
      return '4DX'
    case 'TWO_D':
    case '2D':
    default:
      return '2D'
  }
}

export function mapFrontendFormatToBackend(f?: string): string {
  if (!f) return 'TWO_D'
  const normalized = f.trim().replace(/-/g, '_').replace(/\s+/g, '_').toUpperCase()
  switch (normalized) {
    case 'IMAX_LASER':
    case 'IMAX':
      return 'IMAX_LASER'
    case 'SCREENX':
      return 'SCREENX'
    case 'DOLBY_ATMOS':
    case 'DOLBY':
      return 'DOLBY_ATMOS'
    case 'THREE_D':
    case '3D':
      return 'THREE_D'
    case 'FOUR_DX':
    case '4DX':
      return 'FOUR_DX'
    case 'TWO_D':
    case '2D':
    default:
      return 'TWO_D'
  }
}

export function mapBackendStatusToFrontend(s?: string): AdminTheaterStatus {
  if (!s) return 'active'
  const upper = s.trim().toUpperCase()
  if (upper === 'ACTIVE') return 'active'
  if (upper === 'MAINTENANCE') return 'maintenance'
  return 'inactive'
}

export function mapFrontendStatusToBackend(s?: string): string {
  if (!s) return 'ACTIVE'
  const upper = s.trim().toUpperCase()
  if (upper === 'ACTIVE') return 'ACTIVE'
  if (upper === 'MAINTENANCE') return 'MAINTENANCE'
  return 'INACTIVE'
}

export function mapBackendAuditoriumStatusToFrontend(s?: string): AuditoriumStatus {
  if (!s) return 'active'
  const upper = s.trim().toUpperCase()
  if (upper === 'ACTIVE') return 'active'
  if (upper === 'MAINTENANCE') return 'maintenance'
  if (upper === 'INACTIVE') return 'inactive'
  return 'active'
}

export function mapFrontendAuditoriumStatusToBackend(s?: string): string {
  if (!s) return 'ACTIVE'
  const upper = s.trim().toUpperCase()
  if (upper === 'ACTIVE') return 'ACTIVE'
  if (upper === 'MAINTENANCE') return 'MAINTENANCE'
  if (upper === 'INACTIVE') return 'INACTIVE'
  return 'ACTIVE'
}

export function mapBackendTheaterToAdminTheater(t: BackendTheaterResponse, auditoriums?: BackendAuditoriumResponse[]): AdminTheater {
  return {
    id: t.id,
    name: t.name,
    address: t.address,
    city: t.city,
    hotline: t.hotline,
    openingHours: t.openingHours,
    features: t.features || [],
    imageUrl: t.imageUrl || '',
    status: mapBackendStatusToFrontend(t.status),
    totalRooms: t.totalRooms ?? (auditoriums ? auditoriums.length : 0),
    totalSeats: t.totalSeats ?? 0,
    todayShowtimesCount: 0,
    auditoriums: auditoriums ? auditoriums.map(mapBackendAuditoriumToAdminAuditorium) : undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

export function mapBackendAuditoriumToAdminAuditorium(a: BackendAuditoriumResponse): AdminAuditorium {
  return {
    id: a.id,
    theaterId: a.theaterId,
    name: a.name,
    format: mapBackendFormatToFrontend(a.format),
    totalSeats: a.totalSeats ?? 0,
    activeShowtimesCount: 0,
    status: mapBackendAuditoriumStatusToFrontend(a.status),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}

export function mapBackendSeatsToAdminRows(seats: BackendSeatResponse[]): AdminSeatRow[] {
  const rowMap = new Map<string, AdminSeatItem[]>()

  // Sort seats: rowLabel (A, B, C...) then seatNumber (1, 2, 3...)
  const sorted = [...(seats || [])].sort((a, b) => {
    if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel)
    return a.seatNumber - b.seatNumber
  })

  for (const s of sorted) {
    if (!rowMap.has(s.rowLabel)) {
      rowMap.set(s.rowLabel, [])
    }
    const typeStr = (s.seatType || 'STANDARD').toUpperCase()
    let type: AdminSeatType = 'standard'
    if (typeStr === 'VIP') type = 'vip'
    else if (typeStr === 'COUPLE') type = 'couple'

    rowMap.get(s.rowLabel)!.push({
      id: s.id,
      seatNumber: s.displayName || `${s.rowLabel}${s.seatNumber}`,
      row: s.rowLabel,
      col: s.seatNumber,
      type,
      status: 'available',
      isAisleAfter: false,
    })
  }

  return Array.from(rowMap.entries())
    .sort(([labelA], [labelB]) => labelA.localeCompare(labelB))
    .map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats,
    }))
}

// ==========================================
// Theater API Service Class
// ==========================================

export const theaterApiService = {
  /**
   * Lấy danh sách rạp công khai (Public)
   */
  async getPublicTheaters(city?: string): Promise<AdminTheater[]> {
    const params = new URLSearchParams()
    if (city && city !== 'Tất cả') {
      params.set('city', city)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const data = await apiClient.get<BackendTheaterResponse[]>(`/theaters${query}`)
    return (data || []).map((t) => mapBackendTheaterToAdminTheater(t))
  },

  /**
   * Lấy chi tiết rạp công khai kèm danh sách phòng chiếu
   */
  async getPublicTheaterById(id: string): Promise<AdminTheater> {
    const data = await apiClient.get<BackendTheaterDetailResponse>(`/theaters/${id}`)
    return mapBackendTheaterToAdminTheater(data, data.auditoriums)
  },

  /**
   * Lấy danh sách rạp phân trang cho Admin
   */
  async getAdminTheaters(filters: Partial<TheaterFilterState> = {}): Promise<TheaterPaginationResult> {
    const params = new URLSearchParams()
    params.set('page', String(filters.page && filters.page > 0 ? filters.page - 1 : 0))
    params.set('size', String(filters.pageSize || 10))

    if (filters.search && filters.search.trim()) {
      params.set('search', filters.search.trim())
    }
    if (filters.city && filters.city !== 'all' && filters.city !== 'Tất cả') {
      params.set('city', filters.city)
    }
    if (filters.status && filters.status !== 'all') {
      params.set('status', mapFrontendStatusToBackend(filters.status))
    }

    const data = await apiClient.get<BackendPageResponse<BackendTheaterResponse>>(`/admin/theaters?${params.toString()}`)
    const rawItems = data.items || data.content || []
    const total = data.total ?? data.totalElements ?? rawItems.length
    const pageSize = data.pageSize ?? data.size ?? filters.pageSize ?? 10

    return {
      items: rawItems.map((t) => mapBackendTheaterToAdminTheater(t)),
      total,
      page: (data.page ?? 0) + 1,
      pageSize,
      totalPages: data.totalPages ?? 1,
    }
  },

  /**
   * Chi tiết cụm rạp cho Admin (kèm danh sách phòng chiếu)
   */
  async getAdminTheaterById(id: string): Promise<AdminTheater> {
    const data = await apiClient.get<BackendTheaterDetailResponse>(`/admin/theaters/${id}`)
    return mapBackendTheaterToAdminTheater(data, data.auditoriums)
  },

  /**
   * Tạo cụm rạp mới
   */
  async createTheater(formData: TheaterFormData): Promise<AdminTheater> {
    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      hotline: formData.hotline.trim(),
      openingHours: formData.openingHours.trim(),
      features: formData.features || [],
      imageUrl: formData.imageUrl?.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
      status: mapFrontendStatusToBackend(formData.status),
    }
    const data = await apiClient.post<BackendTheaterResponse>('/admin/theaters', payload)
    return mapBackendTheaterToAdminTheater(data)
  },

  /**
   * Cập nhật cụm rạp
   */
  async updateTheater(id: string, formData: TheaterFormData): Promise<AdminTheater> {
    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      hotline: formData.hotline.trim(),
      openingHours: formData.openingHours.trim(),
      features: formData.features || [],
      imageUrl: formData.imageUrl?.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
      status: mapFrontendStatusToBackend(formData.status),
    }
    const data = await apiClient.put<BackendTheaterResponse>(`/admin/theaters/${id}`, payload)
    return mapBackendTheaterToAdminTheater(data)
  },

  /**
   * Cập nhật nhanh trạng thái cụm rạp
   */
  async updateTheaterStatus(id: string, currentTheater: AdminTheater, newStatus: AdminTheaterStatus): Promise<AdminTheater> {
    return this.updateTheater(id, {
      name: currentTheater.name,
      address: currentTheater.address,
      city: currentTheater.city,
      hotline: currentTheater.hotline,
      openingHours: currentTheater.openingHours,
      features: currentTheater.features,
      imageUrl: currentTheater.imageUrl,
      status: newStatus,
    })
  },

  /**
   * Xóa / Ngừng hoạt động cụm rạp (soft delete sang INACTIVE)
   */
  async deleteTheater(id: string): Promise<void> {
    await apiClient.delete<void>(`/admin/theaters/${id}`)
  },

  // ==========================================
  // Phòng Chiếu (Auditoriums)
  // ==========================================

  /**
   * Lấy danh sách phòng chiếu thuộc cụm rạp
   */
  async getAuditoriumsByTheaterId(theaterId: string, status?: string): Promise<AdminAuditorium[]> {
    const params = new URLSearchParams()
    if (status && status !== 'all') {
      params.set('status', mapFrontendAuditoriumStatusToBackend(status))
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const data = await apiClient.get<BackendAuditoriumResponse[]>(`/admin/theaters/${theaterId}/auditoriums${query}`)
    return (data || []).map(mapBackendAuditoriumToAdminAuditorium)
  },

  /**
   * Lấy chi tiết phòng chiếu theo ID
   */
  async getAuditoriumById(id: string): Promise<AdminAuditorium> {
    const data = await apiClient.get<BackendAuditoriumResponse>(`/admin/auditoriums/${id}`)
    return mapBackendAuditoriumToAdminAuditorium(data)
  },

  /**
   * Tạo phòng chiếu mới
   */
  async createAuditorium(theaterId: string, formData: AuditoriumFormData): Promise<AdminAuditorium> {
    const payload = {
      name: formData.name.trim(),
      format: mapFrontendFormatToBackend(formData.format),
      status: mapFrontendAuditoriumStatusToBackend(formData.status),
    }
    const data = await apiClient.post<BackendAuditoriumResponse>(`/admin/theaters/${theaterId}/auditoriums`, payload)
    return mapBackendAuditoriumToAdminAuditorium(data)
  },

  /**
   * Cập nhật thông tin phòng chiếu
   */
  async updateAuditorium(id: string, formData: AuditoriumFormData): Promise<AdminAuditorium> {
    const payload = {
      name: formData.name.trim(),
      format: mapFrontendFormatToBackend(formData.format),
      status: mapFrontendAuditoriumStatusToBackend(formData.status),
    }
    const data = await apiClient.put<BackendAuditoriumResponse>(`/admin/auditoriums/${id}`, payload)
    return mapBackendAuditoriumToAdminAuditorium(data)
  },

  /**
   * Xóa / Ngừng hoạt động phòng chiếu (soft delete sang INACTIVE)
   */
  async deleteAuditorium(id: string): Promise<void> {
    await apiClient.delete<void>(`/admin/auditoriums/${id}`)
  },

  // ==========================================
  // Sơ Đồ Ghế (Seats & Layout Generation)
  // ==========================================

  /**
   * Lấy sơ đồ ghế phòng chiếu cho Admin
   */
  async getAuditoriumSeats(auditoriumId: string): Promise<BackendSeatLayoutResponse> {
    return apiClient.get<BackendSeatLayoutResponse>(`/admin/auditoriums/${auditoriumId}/seats`)
  },

  /**
   * Sinh tự động sơ đồ ghế hàng-cột cho phòng chiếu
   */
  async generateSeatLayout(auditoriumId: string, payload: SeatGeneratePayload): Promise<BackendSeatLayoutResponse> {
    return apiClient.post<BackendSeatLayoutResponse>(`/admin/auditoriums/${auditoriumId}/seats/generate`, payload)
  },
}


