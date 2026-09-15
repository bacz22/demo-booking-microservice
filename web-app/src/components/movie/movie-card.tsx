import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, Film } from 'lucide-react'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { cn } from '@/lib/utils'

export interface MovieCardProps {
  id: string
  title: string
  posterUrl: string
  ageRating?: string
  duration?: number | string
  genres?: string[]
  rating?: number
  releaseDate?: string
  status?: string
  className?: string
}

export function MovieCard({
  id,
  title,
  posterUrl,
  ageRating,
  duration,
  genres = [],
  rating,
  status,
  className,
}: MovieCardProps) {
  const [imageError, setImageError] = useState(false)



  // Định dạng hiển thị thời lượng (phút)
  const formattedDuration =
    typeof duration === 'number'
      ? `${duration} phút`
      : duration
        ? `${duration}`
        : null

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl transition-all duration-300',
        'hover:-translate-y-1.5 focus-within:-translate-y-1.5',
        className
      )}
    >
      <Link
        to={`/movies/${id}`}
        aria-label={`Xem chi tiết phim ${title}`}
        className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
      >
        {/* Poster Container - Visual Focus chính (Tỉ lệ 2:3) */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-card border border-border/40 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/15">
          {!imageError ? (
            <img
              src={posterUrl}
              alt={`Poster phim ${title}`}
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-card p-4 text-center text-muted-foreground">
              <Film className="h-12 w-12 stroke-1 text-muted-foreground/50 mb-2" aria-hidden="true" />
              <span className="text-xs line-clamp-2">{title}</span>
            </div>
          )}

          {/* Vignette Gradient Overlay nhẹ ở chân poster */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80"
            aria-hidden="true"
          />

          {/* Badge độ tuổi (Góc trên bên trái) */}
          {ageRating && (
            <div className="absolute top-2.5 left-2.5">
              <AgeRatingBadge ageRating={ageRating} size="sm" />
            </div>
          )}

          {/* Badge Trạng thái phim (Góc trên bên phải nếu có) */}
          {status === 'coming-soon' && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center rounded-md bg-secondary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground border border-border/50 backdrop-blur-md">
                Sắp chiếu
              </span>
            </div>
          )}

          {/* Rating Badge (Góc dưới bên trái của Poster) */}
          {typeof rating === 'number' && rating > 0 && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs font-bold text-foreground backdrop-blur-md border border-border/40 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Hiệu ứng nút Xem chi tiết / Đặt vé nhanh khi hover trên desktop */}
          <div className="absolute inset-x-3 bottom-3 hidden md:flex items-center justify-center opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="w-full rounded-lg bg-primary py-2 text-center text-xs font-semibold text-primary-foreground shadow-md shadow-primary/30">
              Chi tiết & Đặt vé
            </span>
          </div>
        </div>

        {/* Thông tin bên dưới Poster */}
        <div className="pt-3 pb-1">
          {/* Tựa đề phim: Giới hạn tối đa 2 dòng, min-h cố định để hàng card luôn thẳng tắp */}
          <h3
            title={title}
            className="text-sm md:text-base font-semibold text-foreground line-clamp-2 min-h-[2.5rem] leading-snug transition-colors group-hover:text-primary"
          >
            {title}
          </h3>

          {/* Metadata phụ: Thời lượng & Thể loại */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {formattedDuration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{formattedDuration}</span>
              </span>
            )}

            {formattedDuration && genres.length > 0 && (
              <span className="text-border" aria-hidden="true">
                •
              </span>
            )}

            {genres.length > 0 && (
              <span className="truncate max-w-[140px]" title={genres.join(', ')}>
                {genres.join(', ')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}

export default MovieCard
