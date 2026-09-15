export type AdminTheaterStatus = 'active' | 'maintenance' | 'inactive'

export type AuditoriumFormat =
  | '2D'
  | '3D'
  | 'IMAX Laser'
  | '4DX'
  | 'ScreenX'
  | 'Dolby Atmos'

export type AuditoriumStatus = 'active' | 'maintenance' | 'inactive'

export interface AdminAuditorium {
  id: string
  theaterId: string
  name: string
  format: AuditoriumFormat
  totalSeats: number // Derived from seat layout - cannot be manually edited independently
  seatMapId?: string
  activeShowtimesCount: number
  status: AuditoriumStatus
  createdAt: string
  updatedAt: string
}

export interface AdminTheater {
  id: string
  name: string
  address: string
  city: string
  hotline: string
  openingHours: string
  features: string[]
  imageUrl: string
  status: AdminTheaterStatus
  totalRooms: number
  totalSeats: number
  todayShowtimesCount: number
  auditoriums?: AdminAuditorium[]
  createdAt: string
  updatedAt: string
}

export interface TheaterFilterState {
  search: string
  city: string
  status: string
  sortBy: 'name' | 'city' | 'totalRooms' | 'totalSeats' | 'todayShowtimes'
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface TheaterPaginationResult {
  items: AdminTheater[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TheaterFormData {
  name: string
  address: string
  city: string
  hotline: string
  openingHours: string
  features: string[]
  imageUrl: string
  status: AdminTheaterStatus
}

export type TheaterFormErrors = Partial<Record<keyof TheaterFormData, string>>

export interface AuditoriumFormData {
  name: string
  format: AuditoriumFormat
  status: AuditoriumStatus
}

export type AuditoriumFormErrors = Partial<Record<keyof AuditoriumFormData, string>>
