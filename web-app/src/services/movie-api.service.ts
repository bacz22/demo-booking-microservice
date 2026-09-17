import { apiClient } from '@/lib/api-client'
import type {
  AdminMovie,
  AdminMovieStatus,
  AdminAgeRating,
  MovieFilterState,
  MovieFormData,
  MoviePaginationResult,
} from '@/types/admin-movie'
export interface BackendMovieResponse {
  id: string
  title: string
  originalTitle?: string
  description?: string
  durationMin: number
  ageRating: string
  releaseDate?: string
  posterUrl?: string
  backdropUrl?: string
  trailerUrl?: string
  rating?: number
  director?: string
  status: string
  genres: string[]
  createdAt: string
}

export interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface CreateMoviePayload {
  title: string
  originalTitle?: string
  description?: string
  durationMin: number
  ageRating: string
  releaseDate?: string
  posterUrl?: string
  backdropUrl?: string
  trailerUrl?: string
  rating?: number
  director?: string
  status?: string
  genres: string[]
}

export interface MediaUploadResult {
  resourceType: string
  publicId?: string
  url?: string
  secureUrl: string
  format?: string
  bytes?: number
  width?: number
  height?: number
  duration?: number
}

function mapBackendMovieToAdminMovie(m: BackendMovieResponse): AdminMovie {
  return {
    id: m.id,
    title: m.title,
    originalTitle: m.originalTitle || '',
    overview: m.description || '',
    duration: m.durationMin,
    releaseDate: m.releaseDate || '',
    ageRating: (m.ageRating as AdminAgeRating) || 'P',
    posterUrl: m.posterUrl || '',
    backdropUrl: m.backdropUrl || '',
    trailerUrl: m.trailerUrl || '',
    rating: m.rating,
    director: m.director || '',
    cast: [],
    status: ((m.status ? m.status.trim().toLowerCase().replace('_', '-') : 'now-showing') as AdminMovieStatus) || 'now-showing',
    genres: m.genres || [],
    showtimeCount: 0,
    updatedAt: m.createdAt || new Date().toISOString(),
    createdAt: m.createdAt || new Date().toISOString(),
  }
}

function mapFormDataToPayload(data: MovieFormData): CreateMoviePayload {
  const statusMap: Record<string, string> = {
    'now-showing': 'NOW_SHOWING',
    'coming-soon': 'COMING_SOON',
    'ended': 'ENDED',
  }

  return {
    title: data.title.trim(),
    originalTitle: data.originalTitle?.trim() || undefined,
    description: data.overview?.trim() || undefined,
    durationMin: Number(data.duration) || 120,
    ageRating: data.ageRating,
    releaseDate: data.releaseDate || undefined,
    posterUrl: data.posterUrl || undefined,
    backdropUrl: data.backdropUrl || undefined,
    trailerUrl: data.trailerUrl || undefined,
    rating: 8.5,
    director: data.director?.trim() || undefined,
    status: statusMap[data.status] || data.status,
    genres: data.genres && data.genres.length > 0 ? data.genres : ['Hành động'],
  }
}

export const movieApiService = {
  /**
   * Lấy danh sách phim có tìm kiếm, lọc và phân trang từ Backend Movie Service.
   * Khi backend chưa chạy hoặc chưa có data, trả về danh sách rỗng để UI hiển thị Empty State.
   */
  async getMovies(filters: Partial<MovieFilterState> = {}): Promise<MoviePaginationResult> {
    const pageIndex = Math.max(0, (filters.page || 1) - 1)
    const pageSize = filters.pageSize || 10

    const params = new URLSearchParams()
    params.set('page', String(pageIndex))
    params.set('size', String(pageSize))

    if (filters.search && filters.search.trim()) {
      params.set('search', filters.search.trim())
    }
    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status)
    }
    if (filters.genre && filters.genre !== 'all') {
      params.set('genre', filters.genre)
    }
    if (filters.ageRating && filters.ageRating !== 'all') {
      params.set('ageRating', filters.ageRating)
    }
    params.set('sort', `${filters.sortBy || 'releaseDate'},${filters.sortOrder || 'desc'}`)

    try {
      const page = await apiClient.get<BackendPage<BackendMovieResponse>>(`/movies?${params.toString()}`)
      const items = (page.content || []).map(mapBackendMovieToAdminMovie)

      return {
        items,
        total: page.totalElements || 0,
        page: (page.number ?? 0) + 1,
        pageSize: page.size || pageSize,
        totalPages: page.totalPages || 0,
      }
    } catch (error) {
      console.warn('[movieApiService] Không thể kết nối Backend API hoặc có lỗi xảy ra:', error)
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 0,
      }
    }
  },

  /**
   * Lấy chi tiết phim theo ID từ backend.
   * Trả về null nếu không tìm thấy hoặc backend không khả dụng.
   */
  async getMovieById(id: string): Promise<AdminMovie | null> {
    try {
      const movie = await apiClient.get<BackendMovieResponse>(`/movies/${id}`)
      return mapBackendMovieToAdminMovie(movie)
    } catch (error) {
      console.warn(`[movieApiService] Lấy phim ${id} từ backend thất bại:`, error)
      return null
    }
  },

  /** Lấy danh sách thể loại từ bảng genres của movie-service. */
  async getGenres(): Promise<string[]> {
    return apiClient.get<string[]>('/genres')
  },

  /**
   * Tạo phim mới qua Backend API (Admin).
   */
  async createMovie(formData: MovieFormData): Promise<AdminMovie> {
    const payload = mapFormDataToPayload(formData)
    const created = await apiClient.post<BackendMovieResponse>('/admin/movies', payload)
    return mapBackendMovieToAdminMovie(created)
  },

  /**
   * Cập nhật thông tin phim qua Backend API (Admin).
   */
  async updateMovie(id: string, formData: MovieFormData): Promise<AdminMovie> {
    const payload = mapFormDataToPayload(formData)
    const updated = await apiClient.put<BackendMovieResponse>(`/admin/movies/${id}`, payload)
    return mapBackendMovieToAdminMovie(updated)
  },

  /**
   * Cập nhật nhanh trạng thái phim qua Backend API (Admin).
   */
  async updateMovieStatus(movie: AdminMovie, newStatus: AdminMovieStatus): Promise<AdminMovie> {
    const statusMap: Record<string, string> = {
      'now-showing': 'NOW_SHOWING',
      'coming-soon': 'COMING_SOON',
      'ended': 'ENDED',
    }

    const payload: CreateMoviePayload = {
      title: movie.title,
      originalTitle: movie.originalTitle || undefined,
      description: movie.overview || undefined,
      durationMin: movie.duration,
      ageRating: movie.ageRating,
      releaseDate: movie.releaseDate || undefined,
      posterUrl: movie.posterUrl || undefined,
      backdropUrl: movie.backdropUrl || undefined,
      trailerUrl: movie.trailerUrl || undefined,
      rating: movie.rating ?? 8.5,
      director: movie.director || undefined,
      status: statusMap[newStatus] || 'NOW_SHOWING',
      genres: movie.genres && movie.genres.length > 0 ? movie.genres : ['Hành động'],
    }

    const updated = await apiClient.put<BackendMovieResponse>(`/admin/movies/${movie.id}`, payload)
    return mapBackendMovieToAdminMovie(updated)
  },

  /**
   * Xóa phim theo ID qua Backend API (Admin).
   */
  async deleteMovie(id: string): Promise<void> {
    await apiClient.delete(`/admin/movies/${id}`)
  },

  /**
   * Upload ảnh Poster hoặc Backdrop lên Cloudinary thông qua backend.
   */
  async uploadImage(file: File): Promise<MediaUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.postForm<MediaUploadResult>('/admin/media/image', formData)
  },

  /**
   * Upload video Trailer lên Cloudinary thông qua backend.
   */
  async uploadVideo(file: File): Promise<MediaUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.postForm<MediaUploadResult>('/admin/media/video', formData)
  },
}
