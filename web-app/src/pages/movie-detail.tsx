import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { MovieInfo } from '@/components/movie/movie-info'
import { ShowtimeDateSelector } from '@/components/movie/showtime-date-selector'
import { CinemaShowtimeCard } from '@/components/cinema/cinema-showtime-card'
import { EmptyState } from '@/components/ui/empty-state'
import { getMovieById, HERO_MOVIE } from '@/mocks/movies'
import { MOCK_CINEMAS } from '@/mocks/cinemas'
import { cn } from '@/lib/utils'

/** Format Date sang YYYY-MM-DD */
function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const CITIES = ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']

export default function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()

  // 1. Tìm thông tin phim từ mock data
  const movie = useMemo(() => {
    if (!movieId) return HERO_MOVIE
    return getMovieById(movieId) || HERO_MOVIE
  }, [movieId])

  // 2. Quản lý trạng thái ngày chiếu được chọn (mặc định là hôm nay)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString)

  // 3. Bộ lọc khu vực / thành phố
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả')

  // 4. Trạng thái suất chiếu đang được chọn (nếu có)
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | undefined>()

  // Cập nhật tiêu đề trang theo phim
  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} - Lịch chiếu & Đặt vé | CineBook`
    }
  }, [movie])

  // Lọc rạp theo thành phố đã chọn
  const filteredCinemas = useMemo(() => {
    if (selectedCity === 'Tất cả') {
      return MOCK_CINEMAS
    }
    return MOCK_CINEMAS.filter((c) => c.city === selectedCity)
  }, [selectedCity])

  // Điều hướng sang trang chọn ghế khi click vào suất chiếu
  const handleSelectShowtime = (showtime: { id: string }) => {
    setSelectedShowtimeId(showtime.id)
    navigate(`/booking/${showtime.id}/seats`)
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-16">
      {/* Nút quay lại trang danh sách phim */}
      <div>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách phim</span>
        </Link>
      </div>

      {/* SECTION 1: THÔNG TIN PHIM */}
      <section aria-label="Thông tin chi tiết phim">
        <MovieInfo
          title={movie.title}
          posterUrl={movie.posterUrl}
          backdropUrl={movie.backdropUrl}
          overview={movie.overview}
          genres={movie.genres}
          duration={movie.duration}
          releaseDate={movie.releaseDate}
          director={movie.director}
          cast={movie.cast}
          ageRating={movie.ageRating}
          rating={movie.rating}
        />
      </section>

      {/* SECTION 2: CHỌN NGÀY CHIẾU */}
      <section aria-label="Chọn ngày chiếu" className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
            Chọn ngày chiếu
          </h2>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 p-3 sm:p-5">
          <ShowtimeDateSelector
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </section>

      {/* SECTION 3 & 4: DANH SÁCH RẠP & SUẤT CHIẾU */}
      <section
        aria-label="Danh sách rạp và suất chiếu"
        className="space-y-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="h-6 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
              Danh sách rạp &amp; Suất chiếu
            </h2>
          </div>

          {/* Bộ lọc vị trí / thành phố tiện lợi */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/50 bg-card/60 p-1" role="group" aria-label="Lọc theo thành phố">
            {CITIES.map((city) => {
              const isActive = selectedCity === city
              return (
                <button
                  key={city}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  )}
                >
                  {city}
                </button>
              )
            })}
          </div>
        </div>

        {/* Danh sách các rạp chiếu phim */}
        {filteredCinemas.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {filteredCinemas.map((cinema) => (
              <CinemaShowtimeCard
                key={cinema.id}
                cinemaName={cinema.name}
                cinemaAddress={cinema.address}
                distance={cinema.distance}
                showtimes={cinema.showtimes}
                selectedShowtimeId={selectedShowtimeId}
                onSelectShowtime={handleSelectShowtime}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title={`Không có rạp nào tại khu vực ${selectedCity}`}
            description="Vui lòng thử chọn khu vực khác hoặc ngày chiếu khác."
            action={
              selectedCity !== 'Tất cả'
                ? {
                    label: 'Xem tất cả khu vực',
                    onClick: () => setSelectedCity('Tất cả'),
                  }
                : undefined
            }
          />
        )}
      </section>
    </div>
  )
}
