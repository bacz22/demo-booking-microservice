import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Star, Film } from 'lucide-react'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { ShowtimeButton } from '@/components/movie/showtime-button'
import type { CinemaMovieSchedule } from '@/mocks/cinemas'
import type { ShowtimeItem } from '@/types/showtime'
import { cn } from '@/lib/utils'

export interface CinemaMovieScheduleCardProps {
  schedule: CinemaMovieSchedule
  onSelectShowtime?: (schedule: CinemaMovieSchedule, showtime: ShowtimeItem) => void
  className?: string
}

export function CinemaMovieScheduleCard({
  schedule,
  onSelectShowtime,
  className,
}: CinemaMovieScheduleCardProps) {
  const [imageError, setImageError] = useState(false)

  // Nhóm các suất chiếu theo format (2D, 3D, IMAX...)
  const formats = Array.from(new Set(schedule.showtimes.map((s) => s.format || '2D')))

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5 shadow-xs backdrop-blur-xs transition-all hover:border-border/80',
        className
      )}
    >
      {/* Poster phim với tỷ lệ 2:3 chuẩn rạp */}
      <div className="relative h-44 w-32 sm:h-48 sm:w-34 shrink-0 overflow-hidden rounded-xl bg-muted/40 shadow-sm mx-auto sm:mx-0">
        {!imageError && schedule.posterUrl ? (
          <img
            src={schedule.posterUrl}
            alt={`Poster phim ${schedule.movieTitle}`}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Film className="h-8 w-8" aria-hidden="true" />
          </div>
        )}

        {/* Badge độ tuổi */}
        {schedule.ageRating && (
          <div className="absolute top-2 left-2 z-10">
            <AgeRatingBadge ageRating={schedule.ageRating} size="sm" />
          </div>
        )}
      </div>

      {/* Thông tin phim & Suất chiếu */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              to={`/movies/${schedule.movieId}`}
              className="text-base sm:text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {schedule.movieTitle}
            </Link>

            {schedule.rating && (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 shrink-0">
                <Star className="h-3.5 w-3.5 fill-amber-400" aria-hidden="true" />
                <span>{schedule.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Thể loại & Thời lượng */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {schedule.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{schedule.duration} phút</span>
              </span>
            )}
            {schedule.duration && schedule.genres && <span>&bull;</span>}
            {schedule.genres && <span>{schedule.genres.join(', ')}</span>}
          </div>
        </div>

        {/* Danh sách suất chiếu theo từng format */}
        <div className="pt-2 border-t border-border/40 space-y-2.5">
          {formats.map((fmt) => {
            const showtimesInFormat = schedule.showtimes.filter(
              (s) => (s.format || '2D') === fmt
            )

            return (
              <div key={fmt} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="shrink-0 text-xs font-bold text-foreground min-w-[65px]">
                  {fmt}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {showtimesInFormat.map((st) => (
                    <ShowtimeButton
                      key={st.id}
                      startTime={st.startTime}
                      endTime={st.endTime}
                      format={st.format}
                      language={st.language}
                      remainingSeats={st.remainingSeats}
                      soldOut={st.soldOut}
                      onClick={() => onSelectShowtime?.(schedule, st)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CinemaMovieScheduleCard
