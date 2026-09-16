export type AdminMovieStatus = 'now-showing' | 'coming-soon' | 'ended'

export type AdminAgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18'

export interface AdminMovie {
  id: string
  title: string
  originalTitle?: string
  overview?: string
  posterUrl: string
  backdropUrl?: string
  trailerUrl?: string
  duration: number // phút
  releaseDate: string // YYYY-MM-DD
  ageRating: AdminAgeRating
  genres: string[]
  rating?: number
  director?: string
  cast?: string[]
  status: AdminMovieStatus
  showtimeCount: number
  updatedAt: string
  createdAt: string
}

export interface MovieFilterState {
  search: string
  status: string // 'all' | AdminMovieStatus
  genre: string // 'all' | string
  ageRating: string // 'all' | AdminAgeRating
  sortBy: 'releaseDate' | 'updatedAt' | 'title'
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface MovieFormData {
  title: string
  originalTitle: string
  overview: string
  genres: string[]
  ageRating: AdminAgeRating
  status: AdminMovieStatus
  duration: string | number
  releaseDate: string
  director: string
  cast: string // Chuỗi phân tách bằng dấu phẩy
  posterUrl: string
  backdropUrl: string
  trailerUrl: string
}

export type MovieFormErrors = Partial<Record<keyof MovieFormData, string>>

export interface MoviePaginationResult {
  items: AdminMovie[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
