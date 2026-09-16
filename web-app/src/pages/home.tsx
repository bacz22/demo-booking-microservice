import { useState, useEffect } from 'react'
import { Film } from 'lucide-react'
import { MovieHero } from '@/components/movie/movie-hero'
import { MovieSection } from '@/components/movie/movie-section'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { Movie } from '@/types/movie'
import { movieApiService } from '@/services/movie-api.service'

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = 'CineBook — Đặt Vé Xem Phim Trực Tuyến'

    setIsLoading(true)
    movieApiService.getMovies({ pageSize: 50 })
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setMovies(
            res.items.map((m) => ({
              id: m.id,
              title: m.title,
              originalTitle: m.originalTitle,
              overview: m.overview,
              posterUrl: m.posterUrl,
              backdropUrl: m.backdropUrl,
              trailerUrl: m.trailerUrl,
              duration: m.duration,
              releaseDate: m.releaseDate,
              ageRating: m.ageRating,
              genres: m.genres,
              rating: m.rating,
              director: m.director,
              cast: m.cast,
              status: m.status as any,
            }))
          )
        } else {
          setMovies([])
        }
      })
      .catch(() => {
        setMovies([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-8 md:space-y-12 pb-8 animate-pulse">
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          icon={Film}
          title="Chưa có dữ liệu phim"
          description="Hiện tại hệ thống rạp chưa có dữ liệu phim nào hoặc máy chủ backend chưa sẵn sàng. Vui lòng quay lại sau."
          className="py-16"
        />
      </div>
    )
  }

  const heroMovie = movies[0]
  const nowShowingMovies = movies.filter((m) => m.status === 'now-showing')
  const comingSoonMovies = movies.filter((m) => m.status === 'coming-soon')
  const featuredMovies = [...movies].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8)

  return (
    <div className="space-y-8 md:space-y-12 pb-8">
      {/* 1. Hero Section */}
      {heroMovie && (
        <MovieHero
          id={heroMovie.id}
          title={heroMovie.title}
          overview={heroMovie.overview}
          backdropUrl={heroMovie.backdropUrl ?? ''}
          posterUrl={heroMovie.posterUrl}
          genres={heroMovie.genres}
          duration={heroMovie.duration}
          ageRating={heroMovie.ageRating}
          rating={heroMovie.rating}
        />
      )}

      {/* 2. Section: Phim đang chiếu */}
      {nowShowingMovies.length > 0 && (
        <MovieSection
          title="Phim đang chiếu"
          subtitle="Các tác phẩm điện ảnh đỉnh cao đang gây sốt tại phòng vé"
          movies={nowShowingMovies}
          viewAllHref="/movies"
        />
      )}

      {/* 3. Section: Phim sắp chiếu */}
      {comingSoonMovies.length > 0 && (
        <MovieSection
          title="Phim sắp chiếu"
          subtitle="Đặt trước vé những siêu phẩm được đón đợi nhất trong thời gian tới"
          movies={comingSoonMovies}
          viewAllHref="/movies"
        />
      )}

      {/* 4. Section: Phim nổi bật */}
      {featuredMovies.length > 0 && (
        <MovieSection
          title="Phim nổi bật"
          subtitle="Danh sách các bộ phim được khán giả đánh giá cao nhất tuần qua"
          movies={featuredMovies}
          viewAllHref="/movies"
        />
      )}
    </div>
  )
}
