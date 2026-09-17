import { useState } from 'react'
import { Star, Clock, Calendar, User, Users, Film, Play } from 'lucide-react'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { cn } from '@/lib/utils'

export interface MovieInfoProps {
  title: string
  originalTitle?: string
  status?: string
  trailerUrl?: string
  posterUrl: string
  backdropUrl?: string
  overview?: string
  genres?: string[]
  duration?: number | string
  releaseDate?: string
  director?: string
  cast?: string[]
  ageRating?: string
  rating?: number
  className?: string
}

export function MovieInfo({
  title,
  originalTitle,
  status,
  trailerUrl,
  posterUrl,
  backdropUrl,
  overview,
  genres = [],
  duration,
  releaseDate,
  director,
  cast = [],
  ageRating,
  rating,
  className,
}: MovieInfoProps) {
  const [posterError, setPosterError] = useState(false)
  const [backdropError, setBackdropError] = useState(false)



  // Định dạng thời lượng
  const formattedDuration =
    typeof duration === 'number'
      ? `${duration} phút`
      : duration
        ? `${duration}`
        : null

  return (
    <article
      aria-label={`Thông tin chi tiết phim: ${title}`}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-border/40 bg-card/60 shadow-xl',
        className
      )}
    >
      {/* 1. Backdrop Background với Gradient Vignette đa tầng */}
      {backdropUrl && !backdropError && (
        <div
          className="absolute inset-0 h-64 w-full overflow-hidden md:h-80"
          aria-hidden="true"
        >
          <img
            src={backdropUrl}
            alt=""
            onError={() => setBackdropError(true)}
            className="h-full w-full object-cover object-center opacity-40 filter blur-xs md:opacity-30 md:blur-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        </div>
      )}

      {/* 2. Nội dung chi tiết phim */}
      <div className="relative z-10 p-5 sm:p-8 md:p-10 lg:p-12">
        <div className="flex flex-col items-start gap-6 md:flex-row md:gap-10 lg:gap-12">
          {/* Cột Poster (2:3 aspect ratio) */}
          <div className="mx-auto w-44 shrink-0 sm:w-52 md:mx-0 md:w-64 lg:w-72">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/60">
              {!posterError ? (
                <img
                  src={posterUrl}
                  alt={`Poster ${title}`}
                  onError={() => setPosterError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                  <Film
                    className="mb-2 h-12 w-12 stroke-1 text-muted-foreground/40"
                    aria-hidden="true"
                  />
                  <span className="text-xs">{title}</span>
                </div>
              )}

              {/* Badge độ tuổi trên Poster */}
              {ageRating && (
                <div className="absolute top-3 left-3">
                  <AgeRatingBadge ageRating={ageRating} />
                </div>
              )}
            </div>
          </div>

          {/* Cột Chi tiết Thông tin */}
          <div className="flex-1 space-y-5">
            {/* Thể loại & Tựa đề */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {status && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
                      status.toLowerCase().includes('now') || status.toLowerCase().includes('selling')
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                    )}
                  >
                    {status.toLowerCase().includes('now') || status.toLowerCase().includes('selling')
                      ? 'Đang chiếu'
                      : 'Sắp chiếu'}
                  </span>
                )}
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center rounded-lg border border-border/40 bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl text-balance">
                  {title}
                </h1>
                {originalTitle && originalTitle.trim().toLowerCase() !== title.trim().toLowerCase() && (
                  <p className="mt-1 text-sm sm:text-base text-muted-foreground font-medium italic">
                    Tên gốc: {originalTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Thanh thông số nhanh: Rating, Thời lượng, Ngày khởi chiếu & Nút Trailer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/40 py-3 text-xs text-muted-foreground sm:text-sm">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {typeof rating === 'number' && rating > 0 && (
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Star
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    <span>
                      {rating.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        / 10
                      </span>
                    </span>
                  </div>
                )}

                {formattedDuration && (
                  <div className="flex items-center gap-1.5">
                    <Clock
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{formattedDuration}</span>
                  </div>
                )}

                {releaseDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>
                      Khởi chiếu:{' '}
                      <span className="font-medium text-foreground">
                        {releaseDate}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {trailerUrl && (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Xem Trailer</span>
                </a>
              )}
            </div>

            {/* Tóm tắt nội dung phim (Overview) */}
            {overview && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm">
                  Nội dung phim
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base text-pretty">
                  {overview}
                </p>
              </div>
            )}

            {/* Đạo diễn & Diễn viên */}
            <div className="space-y-2.5 pt-1">
              {director && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <span className="flex min-w-[90px] items-center gap-1.5 font-semibold text-foreground">
                    <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Đạo diễn:
                  </span>
                  <span className="text-muted-foreground">{director}</span>
                </div>
              )}

              {cast.length > 0 && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <span className="flex min-w-[90px] items-center gap-1.5 font-semibold text-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Diễn viên:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cast.map((actor, idx) => (
                      <span key={actor} className="text-muted-foreground">
                        {actor}
                        {idx < cast.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default MovieInfo
