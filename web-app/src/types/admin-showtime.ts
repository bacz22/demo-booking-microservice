export type AdminShowtimeStatus = 'scheduled' | 'selling' | 'sold-out' | 'ended' | 'cancelled'

export type ShowtimeTechnologyFormat =
  | '2D'
  | '3D'
  | 'IMAX Laser'
  | '4DX'
  | 'ScreenX'
  | 'Dolby Atmos'

export type ShowtimeLanguageType = 'Phụ đề' | 'Lồng tiếng' | 'Thuyết minh'

export interface AdminShowtime {
  id: string
  movieId: string
  movieTitle: string
  moviePosterUrl: string
  movieDuration: number // phút
  movieAgeRating: string
  theaterId: string
  theaterName: string
  theaterCity: string
  auditoriumId: string
  auditoriumName: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  cleaningBufferMinutes: number // mặc định 15 phút
  format: ShowtimeTechnologyFormat
  language: ShowtimeLanguageType
  basePrice: number // e.g. 110000
  totalSeats: number
  bookedSeats: number
  affectedBookingsCount: number // số lượng đơn đặt vé bị ảnh hưởng khi hủy
  status: AdminShowtimeStatus
  hasConflict?: boolean
  conflictReason?: string
  createdAt: string
  updatedAt: string
}

export interface ShowtimeFilterState {
  search: string
  theaterId: string
  auditoriumId: string
  movieId: string
  dateFrom: string
  dateTo: string
  date?: string
  format: string
  status: string
  sortBy: 'startTime' | 'date' | 'occupancy' | 'price'
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface ShowtimeFormData {
  movieId: string
  theaterId: string
  auditoriumId: string
  date: string
  startTime: string
  endTime: string
  cleaningBufferMinutes: number
  format: ShowtimeTechnologyFormat
  language: ShowtimeLanguageType
  basePrice: number
  status: AdminShowtimeStatus
}

export interface ShowtimeFormErrors {
  movieId?: string
  theaterId?: string
  auditoriumId?: string
  date?: string
  startTime?: string
  basePrice?: string
  general?: string
}

export interface ShowtimeConflictInfo {
  hasConflict: boolean
  conflictWithShowtime?: AdminShowtime
  reason?: string
}

export interface ShowtimePaginationResult {
  items: AdminShowtime[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}
