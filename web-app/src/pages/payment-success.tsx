import { useMemo, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
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
import { toast } from '@/lib/toast'

export default function PaymentSuccessPage() {
  const location = useLocation()

  // 1. Dữ liệu thành công: ưu tiên lấy từ state của CheckoutPage, fallback về mock
  const data = useMemo(() => {
    const s = location.state
    if (s && s.bookingCode) {
      return {
        bookingCode: s.bookingCode as string,
        movie: (s.movie || 'Dune: Hành Tinh Cát - Phần Hai') as string,
        cinema: (s.cinema || 'CineBook Landmark 81') as string,
        room: (s.room || 'Phòng chiếu 02 - ScreenX') as string,
        showtime: (s.showtime || '10:15 • Hôm nay, 14/09/2026') as string,
        seats: (s.seats || ['C5', 'C6']) as string[],
        total: (s.total || 190000) as number,
        paymentMethod: (s.paymentMethod || 'VNPay') as string,
      }
    }

    return {
      bookingCode: 'CB-849201',
      movie: 'Dune: Hành Tinh Cát - Phần Hai',
      cinema: 'CineBook Landmark 81',
      room: 'Phòng chiếu 02 - ScreenX',
      showtime: '10:15 • Hôm nay, 14/09/2026',
      seats: ['C5', 'C6'],
      total: 190000,
      paymentMethod: 'VNPay',
    }
  }, [location.state])

  // Cập nhật tiêu đề trang và hiển thị thông báo đặt vé thành công
  useEffect(() => {
    document.title = 'Đặt vé thành công | CineBook'
    toast.bookingSuccess({
      bookingCode: data.bookingCode,
      movieTitle: data.movie,
      seats: data.seats,
    })
  }, [data.bookingCode, data.movie, data.seats])



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
