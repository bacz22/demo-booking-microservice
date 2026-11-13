import { useState } from 'react'
import { MapPin, Phone, Clock, Navigation, Film, Sparkles, Building2 } from 'lucide-react'
import { ShowtimeButton } from '@/components/movie/showtime-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CinemaWithShowtimes } from '@/types/cinema'
import { cn } from '@/lib/utils'

export interface CinemaCardProps {
  cinema: CinemaWithShowtimes
  onSelectShowtime?: (showtimeId: string) => void
  className?: string
}

export function CinemaCard({
  cinema,
  onSelectShowtime,
  className,
}: CinemaCardProps) {
  const [imageError, setImageError] = useState(false)

  // Nhóm suất chiếu theo định dạng (2D, IMAX 2D, 3D, v.v.)
  const formats = Array.from(new Set(cinema.showtimes.map((s) => s.format || '2D')))

  return (
    <article
      aria-label={`Thông tin rạp chiếu ${cinema.name}`}
      className={cn(
        'group overflow-hidden rounded-2xl border border-border/60 bg-card/85 text-card-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-xl',
        className
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* 1. Cột Ảnh Rạp & Thống kê nổi bật (4 cột trên desktop) */}
        <div className="relative lg:col-span-4 min-h-[200px] lg:min-h-[260px] overflow-hidden bg-muted/30">
          {!imageError && cinema.imageUrl ? (
            <img
              src={cinema.imageUrl}
              alt={`Không gian rạp ${cinema.name}`}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary/60 text-muted-foreground">
              <Building2 className="h-12 w-12 stroke-1" aria-hidden="true" />
            </div>
          )}

          {/* Lớp phủ chuyển màu bảo vệ độ tương phản chữ */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/90" />

          {/* Badges thành phố & khoảng cách góc trên ảnh */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <Badge variant="secondary" className="bg-background/85 backdrop-blur-md text-foreground font-semibold border-border/60 text-xs">
              {cinema.city}
            </Badge>
            {cinema.distance && (
              <Badge variant="default" className="bg-primary text-primary-foreground font-bold text-xs shadow-sm">
                Cách {cinema.distance}
              </Badge>
            )}
          </div>

          {/* Số phòng chiếu ở góc dưới ảnh */}
          {cinema.totalRooms && (
            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-1.5 rounded-lg bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-md border border-border/50">
              <Film className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{cinema.totalRooms} phòng chiếu</span>
            </div>
          )}
        </div>

        {/* 2. Cột Chi tiết Rạp, Tiện ích & Suất chiếu (8 cột trên desktop) */}
        <div className="lg:col-span-8 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          {/* Header rạp & Thông tin địa chỉ */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                {cinema.name}
              </h3>

              {cinema.mapUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="self-start sm:self-auto shrink-0 h-8 gap-1.5 text-xs font-semibold border-border/60 hover:bg-secondary"
                >
                  <a
                    href={cinema.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Xem chỉ đường tới ${cinema.name}`}
                  >
                    <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Chỉ đường</span>
                  </a>
                </Button>
              )}
            </div>

            {/* Địa chỉ chi tiết */}
            <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{cinema.address}</span>
            </div>

            {/* Hotline & Giờ mở cửa */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-xs text-muted-foreground">
              {cinema.hotline && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span>{cinema.hotline}</span>
                </div>
              )}
              {cinema.openingHours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span>{cinema.openingHours}</span>
                </div>
              )}
            </div>

            {/* Tiện ích nổi bật (Features) */}
            {cinema.features && cinema.features.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5" aria-label="Tiện ích rạp">
                {cinema.features.map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground/90"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-primary" aria-hidden="true" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Khối Suất chiếu hôm nay */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Suất chiếu hôm nay
              </span>
              <span className="text-[11px] text-muted-foreground">
                Chọn suất chiếu để đặt vé
              </span>
            </div>

            {/* Danh sách suất chiếu theo từng định dạng */}
            <div className="space-y-2.5">
              {formats.map((fmt) => {
                const showtimesInFormat = cinema.showtimes.filter((s) => (s.format || '2D') === fmt)
                return (
                  <div key={fmt} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="shrink-0 text-xs font-bold text-foreground min-w-[70px]">
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
                          onClick={() => onSelectShowtime?.(st.id)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default CinemaCard
