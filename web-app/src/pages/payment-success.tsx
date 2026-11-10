import { useMemo, useEffect, useState } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Ticket,
  Home,
  MapPin,
  Calendar,
  Armchair,
  Film,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { formatPrice } from '@/lib/utils'
import { bookingApiService } from '@/services/booking-api.service'

interface SuccessData {
  bookingCode: string
  movie: string
  cinema: string
  room: string
  showtime: string
  seats: string[]
  total: number
  paymentMethod: string
}

export default function PaymentSuccessPage() {
  const location = useLocation()

  const [searchParams] = useSearchParams()
  const queryBookingId = searchParams.get('bookingId')
  const [fetched, setFetched] = useState<SuccessData | null>(null)
  const [loadError, setLoadError] = useState(false)

  // 1. Dữ liệu thành công: ưu tiên state từ CheckoutPage; reload trang thì lấy lại theo ?bookingId=
  const fromState = useMemo<SuccessData | null>(() => {
    const s = location.state
    if (!s?.bookingCode) return null
    return {
      bookingCode: s.bookingCode,
      movie: s.movie || 'Vé xem phim CineBook',
      cinema: s.cinema || '',
      room: s.room || '',
      showtime: s.showtime || '',
      seats: s.seats || [],
      total: Number(s.total) || 0,
      paymentMethod: s.paymentMethod || 'MOCK',
    }
  }, [location.state])

  useEffect(() => {
    if (fromState || !queryBookingId) return
    bookingApiService
      .getBookingById(queryBookingId)
      .then((b) => {
        const item = bookingApiService.mapBackendBookingToHistoryItem(b)
        setFetched({
          bookingCode: b.bookingCode,
          movie: item.movieTitle,
          cinema: item.cinema,
          room: item.room ?? '',
          showtime: item.showtime,
          seats: item.seats,
          total: item.total,
          paymentMethod: 'MOCK',
        })
      })
      .catch(() => setLoadError(true))
  }, [fromState, queryBookingId])

  const data = fromState ?? fetched

  // Cập nhật tiêu đề trang và hiển thị thông báo đặt vé thành công
  useEffect(() => {
    document.title = 'Đặt vé thành công | CineBook'
  }, [])

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-sm text-muted-foreground">
        {loadError || !queryBookingId ? (
          <div className="space-y-3">
            <p>Không tìm thấy thông tin vé.</p>
            <Link to="/my-bookings" className="text-primary underline">Xem vé của tôi</Link>
          </div>
        ) : (
          'Đang tải thông tin vé...'
        )}
      </div>
    )
  }



  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12">
      {/* 1. Success Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-success/15 border border-success/30 text-success shadow-lg shadow-success/10">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 stroke-[2.2]" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Đặt vé thành công!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Cảm ơn bạn đã lựa chọn CineBook. Thông tin vé điện tử đã được gửi tới email của bạn.
          </p>
        </div>
      </div>

      {/* 2. Vé điện tử (E-Ticket Card) */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xl backdrop-blur-md">
        {/* Phần trên của vé: Mã đặt vé (căn giữa nổi bật) */}
        <div className="bg-secondary/40 p-5 sm:p-6 border-b border-dashed border-border/60 flex flex-col items-center justify-center gap-1.5 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mã đặt vé (Booking Code)
          </span>
          <div className="flex items-center justify-center gap-2.5">
            <span className="font-mono text-2xl sm:text-3xl font-black text-primary tracking-widest">
              {data.bookingCode}
            </span>
            <CopyButton text={data.bookingCode} title="Sao chép mã đặt vé" />
          </div>
        </div>

        {/* Chi tiết phim và suất chiếu */}
        <div className="p-5 sm:p-8 space-y-5">
          {/* Tên phim */}
          <div className="flex items-start gap-3">
            <Film className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Phim
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {data.movie}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30 text-xs sm:text-sm">
            {/* Rạp & Phòng */}
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Rạp &amp; Phòng</span>
                <span className="font-semibold text-foreground">{data.cinema}</span>
                <p className="text-xs text-muted-foreground">{data.room}</p>
              </div>
            </div>

            {/* Suất chiếu */}
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Suất chiếu</span>
                <span className="font-semibold text-foreground">{data.showtime}</span>
              </div>
            </div>

            {/* Ghế đã chọn */}
            <div className="flex items-start gap-2.5">
              <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Ghế ngồi ({data.seats.length} vé)</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.seats.map((seat) => (
                    <span
                      key={seat}
                      className="inline-flex items-center rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tổng tiền đã thanh toán */}
            <div className="flex items-start gap-2.5 sm:justify-end">
              <div className="sm:text-right">
                <span className="text-[11px] text-muted-foreground block">Tổng thanh toán</span>
                <span className="text-lg sm:text-xl font-black text-primary">
                  {formatPrice(data.total)}
                </span>
                <p className="text-[10px] text-success font-medium">Đã thanh toán thành công</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Nút hành động: "Xem vé" & "Về trang chủ" theo đúng đặc tả */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        {/* Nút Xem vé */}
        <Button asChild variant="primary" size="lg" className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-primary/20">
          <Link to={`/my-bookings/${data.bookingCode}`}>
            <Ticket className="h-4 w-4" aria-hidden="true" />
            <span>Xem vé</span>
          </Link>
        </Button>

        {/* Nút Về trang chủ */}
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-semibold px-8 border-border/60 hover:bg-secondary/80">
          <Link to="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Về trang chủ</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
