import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Film } from 'lucide-react'
import { MovieInfo } from '@/components/movie/movie-info'
import { ShowtimeDateSelector } from '@/components/movie/showtime-date-selector'
import { CinemaShowtimeCard } from '@/components/cinema/cinema-showtime-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { Movie } from '@/types/movie'
import type { ShowtimeItem } from '@/types/showtime'
import { movieApiService } from '@/services/movie-api.service'
import {
  showtimeApiService,
  isoToLocalTime,
  mapBackendFormatToFrontend,
  type BackendMovieShowtimeGroupResponse,
} from '@/services/showtime-api.service'
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

  // 1. Quản lý thông tin phim từ API
  const [movie, setMovie] = useState<Movie | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 2. Quản lý trạng thái ngày chiếu & thành phố
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString)
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả')

  // 3. Suất chiếu thực tế từ Backend API
  const [showtimeGroups, setShowtimeGroups] = useState<BackendMovieShowtimeGroupResponse[]>([])
  const [isShowtimesLoading, setIsShowtimesLoading] = useState(false)

  // 4. Trạng thái suất chiếu đang được chọn
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | undefined>()

  // Tải thông tin chi tiết phim
  useEffect(() => {
    if (!movieId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    movieApiService.getMovieById(movieId)
      .then((m) => {
        if (m) {
          setMovie({
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
          })
        } else {
          setMovie(null)
        }
      })
      .catch(() => {
        setMovie(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [movieId])

  // Tải danh sách suất chiếu của phim theo ngày và khu vực
  useEffect(() => {
    if (!movieId) return

    let isCancelled = false
    setIsShowtimesLoading(true)

    showtimeApiService
      .getPublicShowtimesForMovie(movieId, {
        date: selectedDate,
        city: selectedCity !== 'Tất cả' ? selectedCity : undefined,
      })
      .then((groups) => {
        if (!isCancelled) {
          setShowtimeGroups(groups || [])
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải lịch chiếu phim:', err)
        if (!isCancelled) {
          setShowtimeGroups([])
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsShowtimesLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [movieId, selectedDate, selectedCity])

  // Cập nhật tiêu đề trang theo phim
  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} - Lịch chiếu & Đặt vé | CineBook`
    }
  }, [movie])

  // Điều hướng sang trang chọn ghế khi click vào suất chiếu
  const handleSelectShowtime = (
    showtime: ShowtimeItem,
    cinemaName: string,
    roomName?: string
  ) => {
    setSelectedShowtimeId(showtime.id)
    navigate(`/booking/${showtime.id}/seats`, {
      state: {
        movie: movie
          ? {
              id: movie.id,
              title: movie.title,
              posterUrl: movie.posterUrl,
              duration: movie.duration,
              ageRating: movie.ageRating,
            }
          : undefined,
        cinemaName,
        roomName: roomName || 'Phòng chiếu',
        date: selectedDate,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-8 md:space-y-12 pb-16 animate-pulse">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-[420px] rounded-2xl md:col-span-1" />
          <div className="space-y-4 md:col-span-2">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="space-y-8 pb-16">
        <div>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách phim</span>
          </Link>
        </div>

        <EmptyState
          icon={Film}
          title="Không tìm thấy phim"
          description="Bộ phim bạn đang tìm kiếm không tồn tại hoặc chưa có dữ liệu trên hệ thống."
          action={{
            label: 'Quay lại danh sách phim',
            onClick: () => navigate('/movies'),
          }}
          className="py-16"
        />
      </div>
    )
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
          originalTitle={movie.originalTitle}
          status={movie.status}
          trailerUrl={movie.trailerUrl}
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

        {/* Danh sách các rạp chiếu phim & Suất chiếu */}
        {isShowtimesLoading ? (
          <div className="space-y-4 sm:space-y-6 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4">
                <div className="h-6 w-48 bg-muted rounded-lg" />
                <div className="h-4 w-72 bg-muted/60 rounded" />
                <div className="flex gap-3 pt-2">
                  <div className="h-9 w-24 bg-muted rounded-xl" />
                  <div className="h-9 w-24 bg-muted rounded-xl" />
                  <div className="h-9 w-24 bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : showtimeGroups.length > 0 &&
          showtimeGroups.some(
            (g) => g.showtimes && g.showtimes.some((s) => s.status === 'SELLING')
          ) ? (
          <div className="space-y-4 sm:space-y-6">
            {showtimeGroups
              .filter((g) => g.showtimes && g.showtimes.some((s) => s.status === 'SELLING'))
              .map((group) => {
                const mappedShowtimes: ShowtimeItem[] = (group.showtimes || [])
                  .filter((st) => st.status === 'SELLING')
                  .map((st) => ({
                    id: st.id,
                    movieId: movie?.id,
                    cinemaId: group.theaterId,
                    roomId: st.auditoriumId,
                    roomName: st.auditoriumName,
                    startTime: isoToLocalTime(st.startTime),
                    endTime: isoToLocalTime(st.endTime),
                    format: mapBackendFormatToFrontend(st.format),
                    price: st.priceStandard,
                  }))

                const fullAddress = [
                  group.address || group.theaterAddress,
                  group.city || group.theaterCity,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Chưa cập nhật địa chỉ'

                return (
                  <CinemaShowtimeCard
                    key={group.theaterId}
                    cinemaName={group.theaterName}
                    cinemaAddress={fullAddress}
                    showtimes={mappedShowtimes}
                    selectedShowtimeId={selectedShowtimeId}
                    onSelectShowtime={(st) =>
                      handleSelectShowtime(
                        st,
                        group.theaterName,
                        (group.showtimes || []).find((s) => s.id === st.id)?.auditoriumName
                      )
                    }
                  />
                )
              })}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title={`Chưa có suất chiếu mở bán tại ${selectedCity}`}
            description="Hiện chưa có lịch chiếu phù hợp vào ngày này. Vui lòng chọn ngày chiếu hoặc khu vực khác."
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
