import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Film } from 'lucide-react'
import { SeatMap } from '@/components/booking/seat-map'
import { SeatSelectionSummary } from '@/components/booking/seat-selection-summary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'
import type { SeatItem, SeatRow } from '@/types/seat'
import type { Movie } from '@/types/movie'
import {
  showtimeApiService,
  mapBackendSeatMapToSeatRows,
  isoToLocalTime,
  isoToLocalDate,
  type BackendShowtimeResponse,
  type BackendShowtimeSeatMapResponse,
} from '@/services/showtime-api.service'
import { movieApiService } from '@/services/movie-api.service'

export default function SeatSelectionPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Dữ liệu nạp từ API
  const [showtime, setShowtime] = useState<BackendShowtimeResponse | null>(null)
  const [seatMap, setSeatMap] = useState<BackendShowtimeSeatMapResponse | null>(null)
  const [movie, setMovie] = useState<Partial<Movie> | null>(location.state?.movie || null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 2. Tải thông tin suất chiếu, sơ đồ ghế và phim từ Backend
  useEffect(() => {
    if (!showtimeId) {
      setIsLoading(false)
      setFetchError('Không tìm thấy mã suất chiếu.')
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setFetchError(null)

    Promise.all([
      showtimeApiService.getPublicShowtimeById(showtimeId),
      showtimeApiService.getPublicShowtimeSeats(showtimeId),
    ])
      .then(async ([st, sm]) => {
        if (isCancelled) return
        setShowtime(st)
        setSeatMap(sm)

        // Nếu chưa có thông tin phim trong navigation state, nạp thêm từ Movie Service
        if (!movie?.title && st.movieId) {
          try {
            const mv = await movieApiService.getMovieById(st.movieId)
            if (!isCancelled && mv) {
              setMovie({
                id: mv.id,
                title: mv.title,
                posterUrl: mv.posterUrl,
                duration: mv.duration,
                ageRating: mv.ageRating,
              })
            }
          } catch (err) {
            console.warn('Không thể nạp thêm thông tin chi tiết phim:', err)
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi khi nạp thông tin suất chiếu hoặc sơ đồ ghế:', err)
        if (!isCancelled) {
          setFetchError(
            err?.message || 'Không thể tải thông tin suất chiếu hoặc phòng chiếu từ hệ thống.'
          )
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [showtimeId])

  // 3. Thông tin hiển thị phái sinh
  const movieTitle = movie?.title || showtime?.movieTitle || 'Suất chiếu phim'
  const posterUrl = movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'
  const cinemaName = location.state?.cinemaName || showtime?.theaterName || 'CineBook Cinema'
  const roomName = location.state?.roomName || showtime?.auditoriumName || 'Phòng chiếu'
  const currentDate = location.state?.date || (showtime?.startTime ? isoToLocalDate(showtime.startTime) : 'Hôm nay')
  const startTime = showtime?.startTime ? isoToLocalTime(showtime.startTime) : '10:00'
  const endTime = showtime?.endTime ? isoToLocalTime(showtime.endTime) : ''
  const format = showtime?.auditoriumFormat || showtime?.format || '2D'

  // 4. Chuyển đổi sơ đồ ghế từ API sang cấu trúc SeatRow[]
  const seatRows: SeatRow[] = useMemo(() => {
    if (!seatMap) return []
    return mapBackendSeatMapToSeatRows(seatMap)
  }, [seatMap])

  // 5. Bảng giá vé động từ suất chiếu
  const legendPrices = useMemo(() => {
    return {
      standard: seatMap?.prices?.STANDARD || showtime?.priceStandard || 90000,
      vip: seatMap?.prices?.VIP || showtime?.priceVip || 110000,
      couple: seatMap?.prices?.COUPLE || showtime?.priceCouple || 180000,
    }
  }, [seatMap, showtime])

  // 6. Quản lý trạng thái chọn ghế
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedSeatObjects, setSelectedSeatObjects] = useState<SeatItem[]>([])
  const [maxLimitAlert, setMaxLimitAlert] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = `Chọn ghế - ${movieTitle} | CineBook`
  }, [movieTitle])

  // Xử lý chọn / bỏ chọn ghế (giới hạn tối đa 8 ghế)
  const handleSeatSelect = (seatNumber: string, seat: SeatItem) => {
    if (selectedSeats.includes(seatNumber)) {
      // Bỏ chọn ghế
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber))
      setSelectedSeatObjects((prev) => prev.filter((s) => s.seatNumber !== seatNumber))
      setMaxLimitAlert(false)
    } else {
      // Chọn ghế mới (kiểm tra giới hạn 8 ghế)
      if (selectedSeats.length >= 8) {
        setMaxLimitAlert(true)
        toast.seatError('Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt.')
        return
      }
      setSelectedSeats((prev) => [...prev, seatNumber])
      setSelectedSeatObjects((prev) => [...prev, seat])
      setMaxLimitAlert(false)
    }
  }

  // Tính tổng tiền dựa trên giá của từng ghế đã chọn
  const totalPrice = useMemo(() => {
    return selectedSeatObjects.reduce((sum, seat) => {
      const price = seat.price || legendPrices.standard
      return sum + price
    }, 0)
  }, [selectedSeatObjects, legendPrices])

  // Điều hướng sang trang Checkout khi nhấn Tiếp tục
  const handleContinue = () => {
    if (selectedSeats.length === 0) return

    navigate('/checkout', {
      state: {
        showtimeId,
        movieId: movie?.id || showtime?.movieId,
        movieTitle,
        posterUrl,
        cinemaName,
        roomName,
        showtime: endTime ? `${startTime} - ${endTime}` : startTime,
        startTime,
        date: currentDate,
        seats: selectedSeats,
        selectedSeatObjects,
        total: totalPrice,
        format,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 lg:pb-16 animate-pulse">
        <Skeleton className="h-5 w-48 rounded-lg" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <Skeleton className="h-[420px] w-full rounded-2xl" />
          </div>
          <div className="hidden lg:block lg:col-span-4">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchError || !showtime) {
    return (
      <div className="space-y-8 pb-16">
        <div>
          <Link
            to="/cinemas"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại lịch chiếu rạp</span>
          </Link>
        </div>

        <EmptyState
          icon={Film}
          title="Không tìm thấy suất chiếu"
          description={fetchError || 'Suất chiếu không tồn tại hoặc đã kết thúc.'}
          action={{
            label: 'Xem lịch chiếu khác',
            onClick: () => navigate('/cinemas'),
          }}
          className="py-16"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-16">
      {/* Nút quay lại trang chi tiết phim hoặc lịch chiếu */}
      <div>
        <Link
          to={movie?.id ? `/movies/${movie.id}` : '/cinemas'}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại thông tin phim &amp; lịch chiếu</span>
        </Link>
      </div>

      {/* Thông báo vượt quá giới hạn chọn ghế */}
      {maxLimitAlert && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-xs sm:text-sm text-warning backdrop-blur-sm animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Bạn chỉ có thể chọn tối đa <strong>8 ghế</strong> trong một lần đặt vé.
          </span>
        </div>
      )}

      {/* Bố cục 2 cột: Cột trái sơ đồ rạp (SeatMap) - Cột phải Tóm tắt (SeatSelectionSummary) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* CỘT TRÁI: Sơ đồ ghế ngồi rạp chiếu */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Chọn ghế ngồi
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {cinemaName} • {roomName}
              </p>
            </div>

            <span className="text-xs font-semibold text-primary">
              Định dạng {format} • {startTime}{endTime ? ` - ${endTime}` : ''}
            </span>
          </div>

          {/* Component SeatMap với hàng ghế thực tế từ Backend */}
          <SeatMap
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            rows={seatRows.length > 0 ? seatRows : undefined}
            prices={legendPrices}
            roomName={roomName}
          />
        </div>

        {/* CỘT PHẢI: Tóm tắt đặt vé (SeatSelectionSummary) dính cố định khi cuộn */}
        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
          <SeatSelectionSummary
            movieTitle={movieTitle}
            posterUrl={posterUrl}
            cinemaName={cinemaName}
            roomName={roomName}
            date={currentDate}
            showtime={endTime ? `${startTime} - ${endTime}` : startTime}
            seats={selectedSeats}
            ticketPrice={legendPrices.standard}
            total={totalPrice}
            onContinue={handleContinue}
            continueDisabled={selectedSeats.length === 0}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 p-3.5 backdrop-blur-md lg:hidden shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">
              {selectedSeats.length > 0
                ? `Đã chọn ${selectedSeats.length} ghế: ${selectedSeats.join(', ')}`
                : 'Chưa chọn ghế nào'}
            </div>
            <div className="text-base font-extrabold text-primary">
              {formatPrice(totalPrice)}
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="default"
            disabled={selectedSeats.length === 0}
            onClick={handleContinue}
            className="shrink-0 font-bold shadow-md shadow-primary/20"
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  )
}
