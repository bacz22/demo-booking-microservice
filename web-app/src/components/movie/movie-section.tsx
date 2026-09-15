import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { MovieCard } from '@/components/movie/movie-card'
import { EmptyState } from '@/components/ui/empty-state'
import type { Movie } from '@/types/movie'
import { cn } from '@/lib/utils'

export interface MovieSectionProps {
  title: string
  movies: Movie[]
  viewAllHref?: string
  subtitle?: string
  className?: string
}

export function MovieSection({
  title,
  movies,
  viewAllHref,
  subtitle,
  className,
}: MovieSectionProps) {
  return (
    <section
      aria-label={title}
      className={cn('w-full py-6 md:py-10', className)}
    >
      {/* 1. Header: Heading & View All Link */}
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span
              className="h-6 w-1 rounded-full bg-primary"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="pl-3.5 text-xs text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          >
            <span>Xem tất cả</span>
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>

      {/* 2. Movie Grid: Tái sử dụng MovieCard */}
      {movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
          {movies.map((movie) => (
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
        <EmptyState
          title="Hiện chưa có phim nào"
          description="Danh mục này hiện chưa có phim cập nhật. Vui lòng quay lại sau hoặc khám phá các danh mục khác."
        />
      )}
    </section>
  )
}

export default MovieSection
