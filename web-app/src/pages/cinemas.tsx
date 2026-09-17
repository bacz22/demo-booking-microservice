import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  X,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Navigation,
  Check,
  Calendar,
  Layers,
} from 'lucide-react'
import { CinemaMovieScheduleCard } from '@/components/cinema/cinema-movie-schedule-card'
import { ShowtimeDateSelector } from '@/components/movie/showtime-date-selector'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { CinemaWithShowtimes, CinemaMovieSchedule } from '@/types/cinema'
import type { ShowtimeItem } from '@/types/showtime'
import type { AdminTheater } from '@/types/admin-theater'
import type { AdminMovie } from '@/types/admin-movie'
import { theaterApiService } from '@/services/theater-api.service'
import { movieApiService } from '@/services/movie-api.service'
import { showtimeApiService } from '@/services/showtime-api.service'
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

type ViewMode = 'schedule' | 'all-cinemas'

export default function CinemasPage() {
  const navigate = useNavigate()

  // 1. Chế độ xem: 'schedule' (Lịch chiếu theo rạp) hoặc 'all-cinemas' (Thông tin tất cả cụm rạp)
  const [viewMode, setViewMode] = useState<ViewMode>('schedule')

  // 2. Bộ lọc thành phố & tìm kiếm
  const [selectedCity, setSelectedCity] = useState('Tất cả')
  const [searchQuery, setSearchQuery] = useState('')

  // 3. Dữ liệu rạp, phim và suất chiếu thực tế
  const [theaters, setTheaters] = useState<AdminTheater[]>([])
  const [movies, setMovies] = useState<AdminMovie[]>([])
  const [movieSchedules, setMovieSchedules] = useState<CinemaMovieSchedule[]>([])
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('')

  // 4. Ngày chiếu đang được chọn (Mặc định: hôm nay)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString)

  // 5. Trạng thái Loading
  const [isLoading, setIsLoading] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Rạp chiếu & Lịch chiếu phim | CineBook'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Nạp danh sách rạp và danh sách phim
  useEffect(() => {
    let isCancelled = false

    Promise.all([
      theaterApiService.getPublicTheaters(),
      movieApiService.getMovies({ pageSize: 100 }),
    ])
      .then(([thList, mvRes]) => {
        if (!isCancelled) {
          setTheaters(thList || [])
          setMovies(mvRes.items || [])
          if (thList && thList.length > 0) {
            setSelectedCinemaId((prev) => prev || thList[0].id)
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách rạp và phim:', err)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  // Chuyển đổi AdminTheater sang CinemaWithShowtimes
  const cinemas: CinemaWithShowtimes[] = useMemo(() => {
    return theaters.map((t) => ({
      id: t.id,
      name: t.name,
      address: t.address,
      city: t.city,
      imageUrl:
        t.imageUrl ||
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800',
      hotline: t.hotline || '1900 6868',
      openingHours: t.openingHours || '08:00 - 24:00 (Hàng ngày)',
      totalRooms: t.totalRooms || 6,
      features:
        t.features && t.features.length > 0
          ? t.features
          : ['IMAX Laser', 'Dolby Atmos', 'Ghế VIP'],
      mapUrl: `https://maps.google.com/?q=${encodeURIComponent(
        t.name + ' ' + t.address
      )}`,
      showtimes: [],
      movieSchedules: t.id === selectedCinemaId ? movieSchedules : [],
    }))
  }, [theaters, selectedCinemaId, movieSchedules])

  // Nạp lịch chiếu cho rạp đang chọn vào ngày đã chọn
  useEffect(() => {
    if (!selectedCinemaId) {
      setMovieSchedules([])
      return
    }

    let isCancelled = false
    setIsLoading(true)

    showtimeApiService
      .getAdminShowtimes({
        theaterId: selectedCinemaId,
        dateFrom: selectedDate,
        dateTo: selectedDate,
        status: 'selling',
        pageSize: 100,
      })
      .then((res) => {
        if (isCancelled) return
        const activeItems = (res.items || []).filter(
          (st) => st.status === 'selling'
        )

        // Gom các suất chiếu theo movieId
        const groupedByMovie = new Map<string, typeof activeItems>()
        for (const st of activeItems) {
          if (!groupedByMovie.has(st.movieId)) {
            groupedByMovie.set(st.movieId, [])
          }
          groupedByMovie.get(st.movieId)!.push(st)
        }

        const schedules: CinemaMovieSchedule[] = []
        groupedByMovie.forEach((stList, movieId) => {
          const mv = movies.find(
            (m) => m.id.toLowerCase() === movieId.toLowerCase()
          )
          const showtimeItems: ShowtimeItem[] = stList.map((st) => ({
            id: st.id,
            movieId,
            cinemaId: selectedCinemaId,
            roomId: st.auditoriumId,
            startTime: st.startTime,
            endTime: st.endTime,
            format: st.format,
            language: st.language,
            price: st.basePrice,
          }))

          schedules.push({
            movieId,
            movieTitle:
              mv?.title ||
              stList[0]?.movieTitle ||
              `Phim #${movieId.slice(0, 8)}`,
            originalTitle: mv?.originalTitle,
            posterUrl:
              mv?.posterUrl ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
            ageRating: mv?.ageRating || 'P',
            duration: mv?.duration || stList[0]?.movieDuration || 120,
            genres: mv?.genres || [],
            rating: mv?.rating || 8.5,
            showtimes: showtimeItems.sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            ),
          })
        })

        setMovieSchedules(schedules)
      })
      .catch((err) => {
        console.error('Lỗi khi tải lịch chiếu rạp:', err)
        if (!isCancelled) setMovieSchedules([])
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [selectedCinemaId, selectedDate, movies])

  // Đếm số lượng rạp theo từng thành phố
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Tất cả': cinemas.length,
    }
    CITIES.forEach((c) => {
      if (c !== 'Tất cả') {
        counts[c] = cinemas.filter((cinema) => cinema.city === c).length
      }
    })
    return counts
  }, [cinemas])

  // Danh sách rạp sau khi lọc theo thành phố và từ khóa tìm kiếm
  const filteredCinemas = useMemo(() => {
    return cinemas.filter((cinema) => {
      if (selectedCity !== 'Tất cả' && cinema.city !== selectedCity) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = cinema.name.toLowerCase().includes(q)
        const matchAddress = cinema.address.toLowerCase().includes(q)
        if (!matchName && !matchAddress) {
          return false
        }
      }
      return true
    })
  }, [cinemas, selectedCity, searchQuery])

  // Rạp chiếu hiện tại đang được chọn
  const selectedCinema = useMemo(() => {
    const found = cinemas.find((c) => c.id === selectedCinemaId)
    if (found) return { ...found, movieSchedules }
    return filteredCinemas[0] ? { ...filteredCinemas[0], movieSchedules } : cinemas[0] ? { ...cinemas[0], movieSchedules } : null
  }, [selectedCinemaId, cinemas, filteredCinemas, movieSchedules])

  // Đổi rạp chiếu
  const handleSelectCinema = (cinema: CinemaWithShowtimes) => {
    if (cinema.id === selectedCinemaId) return
    setSelectedCinemaId(cinema.id)
  }

  // Đổi thành phố
  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    const firstInCity = cinemas.find((c) => city === 'Tất cả' || c.city === city)
    if (firstInCity) {
      setSelectedCinemaId(firstInCity.id)
    }
  }

  // Chuyển sang xem lịch chiếu của một rạp cụ thể từ tab Danh sách rạp
  const handleViewScheduleOfCinema = (cinemaId: string) => {
    setSelectedCinemaId(cinemaId)
    setViewMode('schedule')
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // Xử lý khi click vào một suất chiếu cụ thể -> Chuyển sang Chọn Ghế với đầy đủ thông tin
  const handleSelectShowtime = (schedule: CinemaMovieSchedule, showtime: ShowtimeItem) => {
    if (!selectedCinema) return
    navigate(`/booking/${showtime.id}/seats`, {
      state: {
        movie: {
          id: schedule.movieId,
          title: schedule.movieTitle,
          posterUrl: schedule.posterUrl,
        },
        cinemaName: selectedCinema.name,
        showtime: showtime.startTime,
        date: selectedDate,
        roomName: showtime.roomId ? `Phòng chiếu` : 'Phòng chiếu',
      },
    })
  }

  // Reset bộ lọc
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCity('Tất cả')
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-16">
      {/* 1. Page Header & Cinematic Intro */}
      <section aria-label="Giới thiệu hệ thống rạp" className="space-y-4 text-center max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-xs">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Hệ Thống Cụm Rạp &amp; Lịch Chiếu Toàn Quốc</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
          Lịch Chiếu &amp; Cụm Rạp{' '}
          <span className="bg-gradient-to-r from-primary via-red-500 to-amber-500 bg-clip-text text-transparent">
            CineBook
          </span>
        </h1>

        <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Chọn cụm rạp gần bạn nhất để theo dõi danh sách các bộ phim đang chiếu hôm nay và đặt vé trực tuyến
          nhanh chóng với sơ đồ ghế thời gian thực.
        </p>

        {/* Thanh chuyển chế độ xem (View Mode Tabs) */}
        <div className="inline-flex items-center rounded-2xl border border-border/60 bg-card/70 p-1.5 backdrop-blur-md shadow-xs mt-2">
          <button
            type="button"
            onClick={() => setViewMode('schedule')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              viewMode === 'schedule'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>Lịch chiếu theo rạp</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('all-cinemas')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              viewMode === 'all-cinemas'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>Thông tin toàn bộ cụm rạp</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CHẾ ĐỘ XEM 1: LỊCH CHIẾU THEO RẠP (MASTER-DETAIL LAYOUT)                   */}
      {/* ========================================================================= */}
      {viewMode === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* CỘT TRÁI (4 Cột): Bộ lọc thành phố & Danh sách rạp để chọn */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-5 shadow-sm backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Chọn Cụm Rạp</span>
                </h2>
                <span className="text-xs text-muted-foreground">
                  {filteredCinemas.length} rạp
                </span>
              </div>

              {/* Tabs lọc theo thành phố */}
              <div
                role="tablist"
                aria-label="Lọc theo thành phố"
                className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1"
              >
                {CITIES.map((city) => {
                  const isActive = selectedCity === city
                  return (
                    <button
                      key={city}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleCityChange(city)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      {city}
                    </button>
                  )
                })}
              </div>

              {/* Tìm kiếm rạp */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên rạp, đường..."
                  className="pl-8 pr-8 h-9 text-xs bg-background/80"
                  aria-label="Tìm rạp chiếu"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Danh sách các rạp dạng danh sách chọn */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredCinemas.map((cinema) => {
                  const isSelected = cinema.id === selectedCinema?.id
                  return (
                    <button
                      key={cinema.id}
                      type="button"
                      onClick={() => handleSelectCinema(cinema)}
                      className={cn(
                        'w-full text-left rounded-xl p-3 border transition-all duration-150 cursor-pointer flex items-start justify-between gap-2.5',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                          : 'border-border/40 bg-card/40 hover:bg-secondary/60 hover:border-border/80'
                      )}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-bold leading-tight line-clamp-1', isSelected ? 'text-primary' : 'text-foreground')}>
                            {cinema.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {cinema.address}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted-foreground">
                          {cinema.distance && (
                            <span className="font-semibold text-primary">
                              {cinema.distance}
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>{cinema.movieSchedules?.length || 4} phim đang chiếu</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
                        </div>
                      )}
                    </button>
                  )
                })}

                {filteredCinemas.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy rạp phù hợp.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (8 Cột): Thông tin chi tiết rạp + Chọn ngày + Lịch chiếu phân theo từng phim */}
          <div className="lg:col-span-8 space-y-6">
            {selectedCinema ? (
              <>
                {/* 1. Thẻ thông tin rạp đang chọn */}
                <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-md backdrop-blur-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          {selectedCinema.city}
                        </Badge>
                        {selectedCinema.distance && (
                          <Badge variant="default" className="text-[11px] font-bold">
                            Cách {selectedCinema.distance}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground">
                        {selectedCinema.name}
                      </h2>
                    </div>

                    {selectedCinema.mapUrl && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="self-start sm:self-auto shrink-0 h-8 gap-1.5 text-xs font-semibold border-border/60 hover:bg-secondary"
                      >
                        <a
                          href={selectedCinema.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Xem chỉ đường tới ${selectedCinema.name}`}
                        >
                          <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          <span>Chỉ đường</span>
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Địa chỉ & Hotline */}
                  <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground border-t border-border/40 pt-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{selectedCinema.address}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-0.5">
                      {selectedCinema.hotline && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                          <span>Hotline: {selectedCinema.hotline}</span>
                        </div>
                      )}
                      {selectedCinema.openingHours && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                          <span>Giờ mở cửa: {selectedCinema.openingHours}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges Tiện ích rạp */}
                  {selectedCinema.features && selectedCinema.features.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {selectedCinema.features.map((feat) => (
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

                {/* 2. Thanh chọn ngày chiếu (ShowtimeDateSelector) */}
                <div className="rounded-2xl border border-border/50 bg-card/60 p-3 sm:p-4 backdrop-blur-xs space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Chọn ngày chiếu
                  </div>
                  <ShowtimeDateSelector
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
                </div>

                {/* 3. Danh sách các bộ phim đang chiếu tại rạp này */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      Phim đang chiếu tại rạp ({selectedCinema.movieSchedules?.length || 0} phim)
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Click vào giờ chiếu để đặt vé
                    </span>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4" aria-busy="true">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-border/40 bg-card/50 p-5 animate-pulse"
                        >
                          <div className="h-44 w-32 rounded-xl bg-muted/40 shrink-0 mx-auto sm:mx-0" />
                          <div className="flex-1 space-y-3 py-2">
                            <div className="h-5 w-1/2 rounded bg-muted/40" />
                            <div className="h-3.5 w-1/3 rounded bg-muted/30" />
                            <div className="flex gap-2 pt-4">
                              <div className="h-9 w-24 rounded-xl bg-muted/30" />
                              <div className="h-9 w-24 rounded-xl bg-muted/30" />
                              <div className="h-9 w-24 rounded-xl bg-muted/30" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedCinema.movieSchedules && selectedCinema.movieSchedules.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCinema.movieSchedules.map((schedule) => (
                        <CinemaMovieScheduleCard
                          key={schedule.movieId}
                          schedule={schedule}
                          onSelectShowtime={handleSelectShowtime}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Building2}
                      title="Không có suất chiếu cho ngày đã chọn"
                      description="Rạp hiện chưa mở lịch chiếu cho ngày này. Vui lòng chọn một ngày chiếu khác."
                    />
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Building2}
                title="Vui lòng chọn một cụm rạp"
                description="Chọn cụm rạp từ danh sách bên trái để xem lịch chiếu phim."
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHẾ ĐỘ XEM 2: THÔNG TIN TOÀN BỘ CỤM RẠP (OVERVIEW CARDS)                   */}
      {/* ========================================================================= */}
      {viewMode === 'all-cinemas' && (
        <div className="space-y-6">
          {/* Thanh lọc khu vực */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Đang hiển thị{' '}
                <strong className="text-foreground font-semibold">
                  {filteredCinemas.length}
                </strong>{' '}
                cụm rạp
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {CITIES.map((city) => {
                const isActive = selectedCity === city
                return (
                  <button
                    key={city}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedCity(city)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {city} ({cityCounts[city] || 0})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grid danh sách toàn bộ rạp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCinemas.map((cinema) => (
              <article
                key={cinema.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/85 text-card-foreground shadow-md backdrop-blur-sm flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-xl"
              >
                {/* Ảnh sảnh rạp */}
                <div className="relative h-48 w-full overflow-hidden bg-muted/40">
                  {cinema.imageUrl && (
                    <img
                      src={cinema.imageUrl}
                      alt={`Sảnh rạp ${cinema.name}`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant="secondary" className="bg-background/85 backdrop-blur-md text-xs font-semibold">
                      {cinema.city}
                    </Badge>
                    {cinema.distance && (
                      <Badge variant="default" className="text-xs font-bold">
                        Cách {cinema.distance}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Thông tin rạp */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-foreground">{cinema.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{cinema.address}</span>
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                      {cinema.hotline && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" aria-hidden="true" />
                          {cinema.hotline}
                        </span>
                      )}
                      {cinema.openingHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" aria-hidden="true" />
                          {cinema.openingHours}
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    {cinema.features && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {cinema.features.map((feat) => (
                          <span
                            key={feat}
                            className="rounded-md border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                    {cinema.mapUrl && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs border-border/60"
                      >
                        <a
                          href={cinema.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          <span>Chỉ đường</span>
                        </a>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewScheduleOfCinema(cinema.id)}
                      className="font-bold shadow-sm shadow-primary/20"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      <span>Xem lịch chiếu phim</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredCinemas.length === 0 && (
            <EmptyState
              icon={Building2}
              title="Không tìm thấy cụm rạp phù hợp"
              description="Vui lòng thử lại với thành phố khác hoặc xóa bộ lọc."
              action={{
                label: 'Xem tất cả cụm rạp',
                onClick: handleResetFilters,
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
