import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Film, Loader2 } from 'lucide-react'
import { SeatMap } from '@/components/booking/seat-map'
import { SeatSelectionSummary } from '@/components/booking/seat-selection-summary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'
import type { SeatItem, SeatRow, SeatType, SeatStatus } from '@/types/seat'
import type { Movie } from '@/types/movie'
import type { BackendSeatStatusDto } from '@/types/booking'
import {
  showtimeApiService,
  isoToLocalTime,
  isoToLocalDate,
  type BackendShowtimeResponse,
  type BackendShowtimeSeatMapResponse,
} from '@/services/showtime-api.service'
import { movieApiService } from '@/services/movie-api.service'
import { bookingApiService } from '@/services/booking-api.service'

export default function SeatSelectionPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Dữ liệu nạp từ API
  const [showtime, setShowtime] = useState<BackendShowtimeResponse | null>(null)
  const [seatMap, setSeatMap] = useState<BackendShowtimeSeatMapResponse | null>(null)
  const [movie, setMovie] = useState<Partial<Movie> | null>(location.state?.movie || null)
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, BackendSeatStatusDto>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isHolding, setIsHolding] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // 2. Tải thông tin suất chiếu, sơ đồ ghế và phim từ Backend
  const loadInitialData = useCallback(async () => {
    if (!showtimeId) {
      setIsLoading(false)
      setFetchError('Không tìm thấy mã suất chiếu.')
      return
    }

    setIsLoading(true)
    setFetchError(null)

    try {
      const [st, sm, avail] = await Promise.all([
        showtimeApiService.getPublicShowtimeById(showtimeId),
        showtimeApiService.getPublicShowtimeSeats(showtimeId),
        bookingApiService.getShowtimeSeats(showtimeId).catch((err) => {
          console.warn('Chưa nạp được trạng thái ghế thời gian thực từ Booking Service:', err)
          return null
        }),
      ])

      setShowtime(st)
      setSeatMap(sm)

      if (avail?.seats) {
        const map = new Map<string, BackendSeatStatusDto>()
        avail.seats.forEach((s) => map.set(s.seatId, s))
        setAvailabilityMap(map)
      }

      // Nếu chưa có thông tin phim trong navigation state, nạp thêm từ Movie Service
      if (!movie?.title && st.movieId) {
        try {
          const mv = await movieApiService.getMovieById(st.movieId)
          if (mv) {
            setMovie({
              id: mv.id,
              title: mv.title,
              posterUrl: mv.posterUrl,
              duration: mv.duration,
              ageRating: mv.ageRating,
            })
          }
        } catch (err) {
          console.warn('Không thể nạp thêm chi tiết phim:', err)
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp thông tin suất chiếu hoặc sơ đồ ghế:', err)
      setFetchError(
        err?.message || 'Không thể tải thông tin suất chiếu hoặc phòng chiếu từ hệ thống.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [showtimeId, movie?.title])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Ref để kiểm tra ghế đang chọn trong interval polling
  const selectedSeatsRef = useRef<string[]>([])
  const selectedSeatObjectsRef = useRef<SeatItem[]>([])

  // 3. Cơ chế Polling làm mới trạng thái ghế thời gian thực mỗi 6 giây
  useEffect(() => {
    if (!showtimeId || isLoading) return

    const pollInterval = setInterval(async () => {
      try {
        const freshAvail = await bookingApiService.getShowtimeSeats(showtimeId)
        if (freshAvail?.seats) {
          const newMap = new Map<string, BackendSeatStatusDto>()
          freshAvail.seats.forEach((s) => newMap.set(s.seatId, s))
          setAvailabilityMap(newMap)

          // Kiểm tra xem ghế người dùng đang chọn có bị ai khác giữ/mua mất không
          const currentSelected = selectedSeatObjectsRef.current
          const conflictSeats = currentSelected.filter((seat) => {
            if (!seat.id) return false
            const live = newMap.get(seat.id)
            return live && (live.status === 'HELD' || live.status === 'SOLD')
          })

          if (conflictSeats.length > 0) {
            const conflictLabels = conflictSeats.map((s) => s.seatNumber).join(', ')
            toast.seatError(
              `Ghế ${conflictLabels} vừa có người khác giữ chỗ. Vui lòng chọn ghế khác.`
            )

            // Loại bỏ các ghế xung đột khỏi danh sách chọn
            const conflictNumbers = conflictSeats.map((s) => s.seatNumber)
            setSelectedSeats((prev) => prev.filter((s) => !conflictNumbers.includes(s)))
            setSelectedSeatObjects((prev) => prev.filter((s) => !conflictNumbers.includes(s.seatNumber)))
          }
        }
      } catch {
        // Polling lỗi trong nền thì bỏ qua, không làm gián đoạn trải nghiệm người dùng
      }
    }, 6000)

    return () => clearInterval(pollInterval)
  }, [showtimeId, isLoading])

  // 4. Thông tin hiển thị phái sinh
  const movieTitle = movie?.title || showtime?.movieTitle || 'Suất chiếu phim'
  const posterUrl = movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'
  const cinemaName = location.state?.cinemaName || showtime?.theaterName || 'CineBook Cinema'
  const roomName = location.state?.roomName || showtime?.auditoriumName || 'Phòng chiếu'
  const currentDate = location.state?.date || (showtime?.startTime ? isoToLocalDate(showtime.startTime) : 'Hôm nay')
  const startTime = showtime?.startTime ? isoToLocalTime(showtime.startTime) : '10:00'
  const endTime = showtime?.endTime ? isoToLocalTime(showtime.endTime) : ''
  const format = showtime?.auditoriumFormat || showtime?.format || '2D'

  // 5. Bảng giá vé động từ suất chiếu
  const legendPrices = useMemo(() => {
    return {
      standard: seatMap?.prices?.STANDARD || showtime?.priceStandard || 90000,
      vip: seatMap?.prices?.VIP || showtime?.priceVip || 110000,
      couple: seatMap?.prices?.COUPLE || showtime?.priceCouple || 180000,
    }
  }, [seatMap, showtime])

  // 6. Chuyển đổi sơ đồ ghế từ API kết hợp trạng thái thời gian thực từ Booking Service
  const seatRows: SeatRow[] = useMemo(() => {
    if (!seatMap?.seats) return []

    const rowMap = new Map<string, SeatItem[]>()

    // Sắp xếp ghế theo hàng chữ cái (A, B, C...) và số thứ tự
    const sorted = [...seatMap.seats].sort((a, b) => {
      if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel)
      const numA = (a as any).seatNumberInRow ?? (a as any).seatNumber ?? 0
      const numB = (b as any).seatNumberInRow ?? (b as any).seatNumber ?? 0
      return numA - numB
    })

    for (const seat of sorted) {
      if (!rowMap.has(seat.rowLabel)) {
        rowMap.set(seat.rowLabel, [])
      }

      const rawType = (seat.type || 'STANDARD').toUpperCase()
      const seatType: SeatType = rawType === 'COUPLE' ? 'couple' : rawType === 'VIP' ? 'vip' : 'standard'
      const seatNum = (seat as any).seatNumberInRow ?? (seat as any).seatNumber ?? 1
      // Ghế phải có mã định danh duy nhất trên toàn phòng chiếu (ví dụ: A1, B5, C12...)
      const seatCode = (seat as any).displayName || `${seat.rowLabel}${seatNum}`
      const price = seat.price ?? (seatType === 'couple' ? legendPrices.couple : seatType === 'vip' ? legendPrices.vip : legendPrices.standard)

      // Kiểm tra trạng thái thời gian thực từ Booking Service
      const liveState = availabilityMap.get(seat.id)
      let status: SeatStatus = 'available'

      if (seat.status === 'MAINTENANCE') {
        status = 'disabled'
      } else if (liveState) {
        if (liveState.status === 'SOLD') {
          status = 'sold'
        } else if (liveState.status === 'HELD') {
          status = 'held'
        } else if (liveState.status === 'HELD_BY_ME') {
          status = 'available'
        } else {
          status = 'available'
        }
      }

      rowMap.get(seat.rowLabel)!.push({
        id: seat.id, // UUID thực tế của ghế
        seatNumber: seatCode, // Mã duy nhất toàn rạp (A1, B2...)
        row: seat.rowLabel,
        number: Number(seatNum), // Số thứ tự trong hàng (1, 2, 3...)
        type: seatType,
        status,
        price: Number(price),
      })
    }

    return Array.from(rowMap.entries()).map(([rowLabel, seats]) => {
      const primaryType = seats.length > 0 ? seats[0].type : 'standard'
      return {
        rowLabel,
        type: primaryType,
        seats,
      }
    })
  }, [seatMap, availabilityMap, legendPrices])

  // 7. Quản lý trạng thái chọn ghế
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedSeatObjects, setSelectedSeatObjects] = useState<SeatItem[]>([])
  const [maxLimitAlert, setMaxLimitAlert] = useState(false)

  // Đồng bộ ref
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats
    selectedSeatObjectsRef.current = selectedSeatObjects
  }, [selectedSeats, selectedSeatObjects])

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = `Chọn ghế - ${movieTitle} | CineBook`
  }, [movieTitle])

  // Xử lý chọn / bỏ chọn ghế (giới hạn tối đa 8 ghế)
  const handleSeatSelect = (seatNumber: string, seat: SeatItem) => {
    if (isHolding) return
    if (seat.status === 'sold' || seat.status === 'held' || seat.status === 'disabled') {
      return
    }

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

  // Xử lý Giữ Chỗ (Hold Seats) khi người dùng nhấn Tiếp tục
  const handleContinue = async () => {
    if (selectedSeats.length === 0 || isHolding || !showtimeId) return

    const seatIds = selectedSeatObjects.map((s) => s.id).filter(Boolean) as string[]
    if (seatIds.length === 0) {
      toast.error('Không tìm thấy mã định danh ghế hợp lệ.')
      return
    }

    setIsHolding(true)

    try {
      // 1. Gọi Booking Service POST /api/bookings/hold
      const booking = await bookingApiService.holdSeats({
        showtimeId,
        seatIds,
      })

      toast.success('Đã giữ chỗ ghế thành công! Đang chuyển sang thanh toán...')

      // 2. Điều hướng sang trang Checkout với thông tin booking chính thức từ DB
      navigate('/checkout', {
        state: {
          bookingId: booking.id,
          booking,
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
          total: Number(booking.totalAmount) || totalPrice,
          format,
          ageRating: movie?.ageRating || 'P',
        },
      })
    } catch (err: any) {
      console.error('Lỗi khi giữ chỗ ghế:', err)

      if (err?.code === 'SEAT_ALREADY_HELD') {
        toast.seatError('Một hoặc nhiều ghế bạn vừa chọn đã có người khác giữ. Vui lòng chọn ghế khác!')
      } else if (err?.code === 'SHOWTIME_NOT_SELLING') {
        toast.error('Suất chiếu hiện đã tạm ngừng bán vé.')
      } else if (err?.code === 'IDEMPOTENCY_IN_PROGRESS') {
        toast.error('Yêu cầu đang được xử lý, vui lòng chờ trong giây lát...')
      } else {
        toast.error(err?.message || 'Không thể giữ chỗ vé. Vui lòng thử lại.')
      }

      // Làm mới lại trạng thái ghế lập tức để cập nhật ghế vừa bị xung đột
      try {
        const fresh = await bookingApiService.getShowtimeSeats(showtimeId)
        if (fresh?.seats) {
          const newMap = new Map<string, BackendSeatStatusDto>()
          fresh.seats.forEach((s) => newMap.set(s.seatId, s))
          setAvailabilityMap(newMap)

          // Bỏ chọn các ghế đã bị người khác chiếm
          setSelectedSeats((prev) =>
            prev.filter((sNum) => {
              const obj = selectedSeatObjects.find((o) => o.seatNumber === sNum)
              if (!obj?.id) return true
              const live = newMap.get(obj.id)
              return live?.status !== 'HELD' && live?.status !== 'SOLD'
            })
          )
          setSelectedSeatObjects((prev) =>
            prev.filter((obj) => {
              if (!obj.id) return true
              const live = newMap.get(obj.id)
              return live?.status !== 'HELD' && live?.status !== 'SOLD'
            })
          )
        }
      } catch {
        // ignore
      }
    } finally {
      setIsHolding(false)
    }
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
            Bạn chỉ có thể chọn tối đa <strong>8 ghế</strong> trong một lần đặt.
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
            continueDisabled={selectedSeats.length === 0 || isHolding}
            continueText={isHolding ? 'Đang giữ chỗ...' : 'Tiếp tục'}
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
            disabled={selectedSeats.length === 0 || isHolding}
            onClick={handleContinue}
            className="shrink-0 font-bold shadow-md shadow-primary/20"
          >
            {isHolding ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang giữ chỗ...</span>
              </span>
            ) : (
              'Tiếp tục'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
