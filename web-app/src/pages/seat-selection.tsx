import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { SeatMap } from '@/components/booking/seat-map'
import { SeatSelectionSummary } from '@/components/booking/seat-selection-summary'
import { Button } from '@/components/ui/button'
import { findCinemaByShowtimeId, MOCK_CINEMAS } from '@/mocks/cinemas'
import { HERO_MOVIE } from '@/mocks/movies'
import { toast } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'
import type { SeatItem } from '@/types/seat'

export default function SeatSelectionPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Dữ liệu rạp và suất chiếu (từ showtimeId)
  const showtimeData = useMemo(() => {
    if (showtimeId) {
      const found = findCinemaByShowtimeId(showtimeId)
      if (found) return found
    }
    // Fallback nếu showtimeId không tồn tại trong mock
    return {
      cinema: MOCK_CINEMAS[0],
      showtime: MOCK_CINEMAS[0].showtimes[0],
    }
  }, [showtimeId])

  const { cinema, showtime } = showtimeData

  // 2. Dữ liệu phim (ưu tiên lấy từ state, fallback từ showtimeData.movie, cuối cùng là HERO_MOVIE)
  const movie = location.state?.movie || showtimeData.movie || HERO_MOVIE
  const roomName = location.state?.roomName || 'Phòng chiếu 02 - ScreenX'
  const currentDate = location.state?.date || 'Hôm nay, 14/09/2026'

  // 3. Quản lý trạng thái chọn ghế bằng React State
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedSeatObjects, setSelectedSeatObjects] = useState<SeatItem[]>([])
  const [maxLimitAlert, setMaxLimitAlert] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = `Chọn ghế - ${movie.title} | CineBook`
  }, [movie])

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
    return selectedSeatObjects.reduce((sum, seat) => sum + (seat.price || 75000), 0)
  }, [selectedSeatObjects])

  // Điều hướng sang trang Checkout khi nhấn Tiếp tục
  const handleContinue = () => {
    if (selectedSeats.length === 0) return

    navigate('/checkout', {
      state: {
        movieTitle: movie.title,
        posterUrl: movie.posterUrl,
        cinemaName: cinema.name,
        showtime: showtime.startTime,
        date: currentDate,
        roomName,
        seats: selectedSeats,
        total: totalPrice,
      },
    })
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-16">
      {/* Nút quay lại trang chi tiết phim */}
      <div>
        <Link
          to={`/movies/${movie.id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại thông tin phim &amp; suất chiếu</span>
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
                {cinema.name} • {roomName}
              </p>
            </div>

            <span className="text-xs font-semibold text-primary">
              Định dạng {showtime.format || '2D'} • {showtime.language || 'Phụ đề'}
            </span>
          </div>

          {/* Component SeatMap tái sử dụng Seat, CinemaScreen và SeatLegend */}
          <SeatMap
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            roomName={roomName}
          />
        </div>

        {/* CỘT PHẢI: Tóm tắt đặt vé (SeatSelectionSummary) dính cố định khi cuộn */}
        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
          <SeatSelectionSummary
            movieTitle={movie.title}
            posterUrl={movie.posterUrl}
            cinemaName={cinema.name}
            roomName={roomName}
            date={currentDate}
            showtime={showtime.startTime}
            seats={selectedSeats}
            ticketPrice={75000}
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
