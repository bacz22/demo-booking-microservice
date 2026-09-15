import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShowtimeButton } from '@/components/movie/showtime-button'
import type { ShowtimeItem } from '@/types/showtime'

export interface CinemaShowtimeCardProps {
  /** Tên rạp chiếu phim (ví dụ "CineBook Landmark 81") */
  cinemaName: string
  /** Địa chỉ chi tiết của rạp */
  cinemaAddress: string
  /** Danh sách các suất chiếu của rạp */
  showtimes: ShowtimeItem[]
  /** Khoảng cách tới người dùng (tuỳ chọn, ví dụ "1.2 km") */
  distance?: string
  /** ID của suất chiếu đang được chọn */
  selectedShowtimeId?: string
  /** Callback khi người dùng chọn một suất chiếu */
  onSelectShowtime?: (showtime: ShowtimeItem) => void
  className?: string
}

export function CinemaShowtimeCard({
  cinemaName,
  cinemaAddress,
  showtimes = [],
  distance,
  selectedShowtimeId,
  onSelectShowtime,
  className,
}: CinemaShowtimeCardProps) {
  // Lấy danh sách các định dạng phim khác nhau (nếu có nhiều định dạng như 2D, 3D, IMAX)
  const formats = Array.from(new Set(showtimes.map((s) => s.format || '2D')))
  const hasMultipleFormats = formats.length > 1

  return (
    <article
      aria-label={`Rạp chiếu ${cinemaName}`}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card/75 p-4 sm:p-6 shadow-md transition-all hover:border-border/80 hover:shadow-lg',
        className
      )}
    >
      {/* 1. Header: Thông tin tên rạp & địa chỉ */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {cinemaName}
          </h3>

          <div className="flex items-start gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="leading-snug">{cinemaAddress}</span>
          </div>
        </div>

        {/* Badge khoảng cách nếu có */}
        {distance && (
          <div className="shrink-0 self-start">
            <span className="inline-flex items-center rounded-full border border-border/50 bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {distance}
            </span>
          </div>
        )}
      </div>

      {/* Đường phân cách nhẹ */}
      <div className="my-4 h-px w-full bg-border/40" aria-hidden="true" />

      {/* 2. Danh sách suất chiếu - Đảm bảo Wrap đẹp mắt và responsive */}
      {showtimes.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground sm:text-sm">
          Không có suất chiếu nào khả dụng cho ngày đã chọn.
        </div>
      ) : hasMultipleFormats ? (
        // Nếu rạp có nhiều định dạng (ví dụ 2D và IMAX), chia nhóm rõ ràng
        <div className="space-y-4">
          {formats.map((fmt) => {
            const groupShowtimes = showtimes.filter(
              (s) => (s.format || '2D') === fmt
            )
            return (
              <div key={fmt} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Định dạng {fmt}
                  </span>
                  <div className="h-px flex-1 bg-border/30" />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {groupShowtimes.map((st) => (
                    <ShowtimeButton
                      key={st.id}
                      id={st.id}
                      startTime={st.startTime}
                      endTime={st.endTime}
                      format={st.format}
                      language={st.language}
                      remainingSeats={st.remainingSeats}
                      totalSeats={st.totalSeats}
                      selected={selectedShowtimeId === st.id}
                      disabled={st.disabled}
                      soldOut={st.soldOut}
                      onClick={() => onSelectShowtime?.(st)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Nếu cùng 1 định dạng, hiển thị flex-wrap liền mạch
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {showtimes.map((st) => (
            <ShowtimeButton
              key={st.id}
              id={st.id}
              startTime={st.startTime}
              endTime={st.endTime}
              format={st.format}
              language={st.language}
              remainingSeats={st.remainingSeats}
              totalSeats={st.totalSeats}
              selected={selectedShowtimeId === st.id}
              disabled={st.disabled}
              soldOut={st.soldOut}
              onClick={() => onSelectShowtime?.(st)}
            />
          ))}
        </div>
      )}
    </article>
  )
}

export default CinemaShowtimeCard
