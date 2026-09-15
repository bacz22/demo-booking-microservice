import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, Ticket, Info, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { cn } from '@/lib/utils'

export interface MovieHeroProps {
  id: string
  title: string
  overview?: string
  backdropUrl: string
  posterUrl?: string
  genres?: string[]
  duration?: number | string
  ageRating?: string
  rating?: number
  className?: string
}

export function MovieHero({
  id,
  title,
  overview,
  backdropUrl,
  posterUrl,
  genres = [],
  duration,
  ageRating,
  rating,
  className,
}: MovieHeroProps) {
  const [backdropError, setBackdropError] = useState(false)



  // Định dạng thời lượng
  const formattedDuration =
    typeof duration === 'number'
      ? `${duration} phút`
      : duration
        ? `${duration}`
        : null

  return (
    <section
      aria-label={`Phim nổi bật: ${title}`}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-border/40 bg-card shadow-2xl',
        'min-h-[460px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[600px] flex items-end md:items-center',
        className
      )}
    >
      {/* 1. Cinematic Backdrop Image */}
      {!backdropError ? (
        <img
          src={backdropUrl}
          alt={`Hình nền phim ${title}`}
          onError={() => setBackdropError(true)}
          className="absolute inset-0 h-full w-full object-cover object-center md:object-right transition-transform duration-1000 ease-out hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <Film className="h-24 w-24 text-muted-foreground/30 stroke-1" aria-hidden="true" />
        </div>
      )}

      {/* 2. Multi-layer Gradient Overlays: Đảm bảo độ tương phản WCAG AA */}
      {/* Mobile: Gradient từ dưới lên trên che phủ tối ưu cho văn bản */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30 md:hidden"
        aria-hidden="true"
      />
      {/* Desktop: Gradient từ trái sang phải + chân dưới tạo chiều sâu điện ảnh */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-background md:via-background/90 md:to-transparent md:w-3/4"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block bg-gradient-to-t from-background via-transparent to-background/20"
        aria-hidden="true"
      />

      {/* 3. Hero Content */}
      <div className="relative z-10 w-full px-5 py-8 sm:px-8 sm:py-12 md:px-12 lg:px-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl space-y-4 md:space-y-5">
            {/* Badges Bar: Độ tuổi, Rating, Thời lượng, Thể loại */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
              {ageRating && <AgeRatingBadge ageRating={ageRating} />}

              {typeof rating === 'number' && rating > 0 && (
                <div className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2.5 py-1 font-bold text-foreground backdrop-blur-md border border-border/50 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span>{rating.toFixed(1)}</span>
                </div>
              )}

              {formattedDuration && (
                <div className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2.5 py-1 text-muted-foreground backdrop-blur-md border border-border/40">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{formattedDuration}</span>
                </div>
              )}

              {genres.length > 0 && (
                <span className="text-muted-foreground font-medium truncate">
                  {genres.slice(0, 3).join(' • ')}
                </span>
              )}
            </div>

            {/* Tựa đề phim lớn (Display Typography) */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
              {title}
            </h1>

            {/* Overview / Tóm tắt nội dung: Giới hạn dòng, tương phản cao */}
            {overview && (
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground line-clamp-3 md:line-clamp-4 max-w-xl text-pretty">
                {overview}
              </p>
            )}

            {/* CTA kép: Đặt vé & Xem chi tiết */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="gap-2 shadow-lg shadow-primary/30 font-semibold"
              >
                <Link to={`/movies/${id}`}>
                  <Ticket className="h-5 w-5" aria-hidden="true" />
                  <span>Đặt vé ngay</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="secondary"
                size="lg"
                className="gap-2 border-border/60 hover:border-border"
              >
                <Link to={`/movies/${id}`}>
                  <Info className="h-5 w-5" aria-hidden="true" />
                  <span>Xem chi tiết</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Poster nổi bật phụ trên màn hình lớn (Desktop Floating Poster) */}
          {posterUrl && (
            <div className="hidden lg:block shrink-0">
              <div className="relative aspect-[2/3] w-48 xl:w-56 overflow-hidden rounded-xl border border-border/50 shadow-2xl shadow-black/80 transition-transform duration-300 hover:scale-105">
                <img
                  src={posterUrl}
                  alt={`Poster ${title}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MovieHero
