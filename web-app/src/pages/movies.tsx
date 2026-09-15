import { useState, useMemo, useEffect } from 'react'
import { MovieSearchInput } from '@/components/movie/movie-search-input'
import {
  MovieFilters,
  type MovieFilterState,
} from '@/components/movie/movie-filters'
import { MovieCard } from '@/components/movie/movie-card'
import { MovieCardSkeleton } from '@/components/movie/movie-card-skeleton'
import { MovieEmptyState } from '@/components/movie/movie-empty-state'
import { Button } from '@/components/ui/button'
import { ALL_MOVIES } from '@/mocks/movies'

const INITIAL_FILTER_STATE: MovieFilterState = {
  genre: 'all',
  status: 'all',
  sort: 'popular',
}

export default function MoviesPage() {
  useEffect(() => {
    document.title = 'Danh sách phim | CineBook'
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<MovieFilterState>(INITIAL_FILTER_STATE)
  const [isLoading, setIsLoading] = useState(false)

  // Lọc và sắp xếp danh sách phim dựa trên mock data
  const filteredMovies = useMemo(() => {
    return ALL_MOVIES.filter((movie) => {
      // 1. Lọc theo từ khóa tìm kiếm (tên phim, thể loại)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = movie.title.toLowerCase().includes(query)
        const matchGenre = movie.genres?.some((g) =>
          g.toLowerCase().includes(query)
        )
        if (!matchTitle && !matchGenre) {
          return false
        }
      }

      // 2. Lọc theo trạng thái (Đang chiếu / Sắp chiếu)
      if (filters.status !== 'all') {
        if (movie.status !== filters.status) {
          return false
        }
      }

      // 3. Lọc theo thể loại
      if (filters.genre !== 'all' && filters.genre !== 'Tất cả') {
        if (!movie.genres?.includes(filters.genre)) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      // 4. Sắp xếp theo tiêu chí
      if (filters.sort === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }
      if (filters.sort === 'latest') {
        return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')
      }
      // 'popular' hoặc mặc định
      return 0
    })
  }, [searchQuery, filters])

  // Cập nhật bộ lọc kèm hiệu ứng loading nhẹ (mô phỏng trạng thái tải)
  const handleFilterChange = (newFilters: MovieFilterState) => {
    setIsLoading(true)
    setFilters(newFilters)
    setTimeout(() => setIsLoading(false), 150)
  }

  // Đặt lại toàn bộ bộ lọc và từ khóa tìm kiếm
  const handleResetAll = () => {
    setIsLoading(true)
    setSearchQuery('')
    setFilters(INITIAL_FILTER_STATE)
    setTimeout(() => setIsLoading(false), 150)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Heading Page */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Danh sách phim
          </h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground pl-4">
          Khám phá các siêu phẩm điện ảnh đang chiếu và sắp ra rạp tại CineBook
        </p>
      </div>

      {/* 2. Search & Filters Container */}
      <div className="space-y-4">
        <MovieSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Tìm kiếm theo tên phim, thể loại..."
          loading={isLoading}
        />

        <MovieFilters
          values={filters}
          onChange={handleFilterChange}
          onReset={handleResetAll}
        />
      </div>

      {/* Số lượng phim tìm thấy */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1">
        <span>
          Tìm thấy <span className="font-semibold text-foreground">{filteredMovies.length}</span> phim
        </span>
        {(searchQuery || filters.genre !== 'all' || filters.status !== 'all') && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleResetAll}
            className="h-auto p-0 text-primary font-medium"
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* 3. Movie Grid / Loading / Empty State */}
      {isLoading ? (
        /* Loading State Skeleton */
        <div
          aria-label="Đang tải danh sách phim"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        /* Movie Grid */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              posterUrl={movie.posterUrl}
              ageRating={movie.ageRating}
              duration={movie.duration}
              genres={movie.genres}
              rating={movie.rating}
              releaseDate={movie.releaseDate}
              status={movie.status}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <MovieEmptyState
          searchQuery={searchQuery}
          onReset={handleResetAll}
          resetLabel="Đặt lại toàn bộ"
        />
      )}
    </div>
  )
}
