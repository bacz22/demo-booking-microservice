import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, User, Mail, Phone, AlertTriangle } from 'lucide-react'
import { SeatHoldCountdown } from '@/components/booking/seat-hold-countdown'
import { BookingSummaryCard } from '@/components/booking/booking-summary-card'
import { PaymentMethodSelector } from '@/components/payment/payment-method-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { formatPrice } from '@/lib/utils'
import { HERO_MOVIE } from '@/mocks/movies'
import { MOCK_CINEMAS } from '@/mocks/cinemas'
import { toast } from '@/lib/toast'
import type { PaymentMethodId } from '@/types/payment'

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // 1. Dữ liệu đơn đặt vé (Ưu tiên lấy từ state chuyển tiếp của SeatSelectionPage, fallback về mock)
  const bookingData = useMemo(() => {
    const s = location.state
    if (s && s.movieTitle) {
      return {
        movieTitle: s.movieTitle,
        posterUrl: s.posterUrl || HERO_MOVIE.posterUrl,
        cinemaName: s.cinemaName || MOCK_CINEMAS[0].name,
        roomName: s.roomName || 'Phòng chiếu 02 - ScreenX',
        showtime: s.showtime || '10:15',
        date: s.date || 'Hôm nay, 14/09/2026',
        seats: s.seats || ['C5', 'C6'],
        subtotal: s.total || 190000,
        serviceFee: 0,
        total: s.total || 190000,
        format: 'IMAX 2D',
        ageRating: 'T16',
      }
    }

    // Dữ liệu giả lập mặc định nếu truy cập trực tiếp /checkout
    return {
      movieTitle: HERO_MOVIE.title,
      posterUrl: HERO_MOVIE.posterUrl,
      cinemaName: MOCK_CINEMAS[0].name,
      roomName: 'Phòng chiếu 02 - ScreenX',
      showtime: '10:15',
      date: 'Hôm nay, 14/09/2026',
      seats: ['C5', 'C6'],
      subtotal: 190000,
      serviceFee: 0,
      total: 190000,
      format: 'IMAX 2D',
      ageRating: 'T16',
    }
  }, [location.state])

  // 2. Thời điểm hết hạn giữ vé (5 phút từ khi tải trang)
  const [expiresAt] = useState<number>(() => Date.now() + 5 * 60 * 1000)

  const [isExpired, setIsExpired] = useState(false)

  // 3. Phương thức thanh toán được chọn (Mặc định: vnpay)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('vnpay')

  // 4. Thông tin người nhận vé (Mock form)
  const [customerInfo, setCustomerInfo] = useState({
    fullName: 'Nguyễn Văn An',
    email: 'nguyenvanan@example.com',
    phone: '0901234567',
  })

  // 5. Trạng thái Loading khi click thanh toán (Demo loading state)
  const [isProcessing, setIsProcessing] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Thanh toán vé xem phim | CineBook'
  }, [])

  // Xử lý khi nhấn nút CTA "Thanh toán"
  const handlePayment = () => {
    if (isExpired || isProcessing) return

    setIsProcessing(true)

    // Demo loading state giả lập thanh toán trong 1.5 giây mà KHÔNG gọi Payment Service
    setTimeout(() => {
      setIsProcessing(false)

      // Điều hướng sang trang thanh toán thành công (Task 31)
      navigate('/payment/success', {
        state: {
          bookingCode: `CB-${Math.floor(100000 + Math.random() * 900000)}`,
          movie: bookingData.movieTitle,
          cinema: bookingData.cinemaName,
          room: bookingData.roomName,
          showtime: `${bookingData.showtime} • ${bookingData.date}`,
          seats: bookingData.seats,
          total: bookingData.total,
          paymentMethod,
        },
      })
    }, 1500)
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-16">
      {/* Nút quay lại */}
        <div>
          <Link
            to={-1 as unknown as string}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại chọn ghế</span>
          </Link>
        </div>

        {/* Thanh đếm ngược thời gian giữ ghế */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-md">
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Thanh toán đơn hàng
            </h1>
            <p className="text-xs text-muted-foreground">
              Vui lòng hoàn tất thanh toán trước khi thời gian giữ ghế kết thúc.
            </p>
          </div>

          <SeatHoldCountdown
            expiresAt={expiresAt}
            onExpire={() => {
              setIsExpired(true)
              toast.paymentError('Thời gian giữ vé đã kết thúc. Vui lòng chọn lại vé.')
            }}
          />
        </div>

        {/* Cảnh báo khi hết hạn giữ ghế */}
        {isExpired && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive backdrop-blur-sm animate-in fade-in"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>
                <strong>Thời gian giữ ghế đã hết hạn!</strong> Ghế của bạn có thể đã được giải phóng cho khách hàng khác.
              </span>
            </div>
            <Link
              to="/movies"
              className="shrink-0 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90"
            >
              Chọn lại vé
            </Link>
          </div>
        )}

        {/* Bố cục 2 cột chính: Thông tin thanh toán (Trái) & Tóm tắt đơn hàng (Phải) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* CỘT TRÁI (8 Cột): Thông tin khách hàng & Phương thức thanh toán */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            {/* 1. Thông tin người nhận vé */}
            <section
              aria-label="Thông tin người nhận vé"
              className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-md backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Thông tin người nhận vé
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Họ và tên */}
                <FormField
                  id="checkout-fullName"
                  label="Họ và tên"
                  icon={<User className="h-3.5 w-3.5" />}
                  className="sm:col-span-2"
                >
                  <Input
                    id="checkout-fullName"
                    type="text"
                    disabled={isProcessing}
                    value={customerInfo.fullName}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, fullName: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </FormField>

                {/* Email nhận vé */}
                <FormField
                  id="checkout-email"
                  label="Email nhận vé điện tử"
                  icon={<Mail className="h-3.5 w-3.5" />}
                >
                  <Input
                    id="checkout-email"
                    type="email"
                    disabled={isProcessing}
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </FormField>

                {/* Số điện thoại */}
                <FormField
                  id="checkout-phone"
                  label="Số điện thoại"
                  icon={<Phone className="h-3.5 w-3.5" />}
                >
                  <Input
                    id="checkout-phone"
                    type="tel"
                    disabled={isProcessing}
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, phone: e.target.value })
                    }
                    placeholder="0901234567"
                  />
                </FormField>
              </div>
            </section>

            {/* 2. Phương thức thanh toán (PaymentMethodSelector) */}
            <section
              aria-label="Lựa chọn phương thức thanh toán"
              className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-md backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Chọn phương thức thanh toán
                </h2>
              </div>

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                disabled={isProcessing || isExpired}
              />
            </section>

            {/* Cam kết bảo mật */}
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/30 p-3.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>
                Giao dịch của bạn được bảo mật tuyệt đối với tiêu chuẩn mã hóa SSL 256-bit và tuân thủ chuẩn PCI-DSS quốc tế.
              </span>
            </div>
          </div>

          {/* CỘT PHẢI (4 Cột): Tóm tắt đơn vé & Nút CTA Thanh toán */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <BookingSummaryCard
              posterUrl={bookingData.posterUrl}
              movieTitle={bookingData.movieTitle}
              cinemaName={bookingData.cinemaName}
              roomName={bookingData.roomName}
              date={bookingData.date}
              showtime={bookingData.showtime}
              seats={bookingData.seats}
              ticketPrice={75000}
              subtotal={bookingData.subtotal}
              serviceFee={bookingData.serviceFee}
              total={bookingData.total}
              format={bookingData.format}
              ageRating={bookingData.ageRating}
            />

            {/* CTA Nút Thanh toán theo yêu cầu của đặc tả */}
            <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-lg backdrop-blur-md">
              <Button
                type="button"
                variant="primary"
                size="lg"
                loading={isProcessing}
                disabled={isExpired || isProcessing || bookingData.seats.length === 0}
                onClick={handlePayment}
                className="w-full font-bold text-base shadow-xl shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>
                  {isProcessing
                    ? 'Đang xử lý thanh toán...'
                    : `Thanh toán ${formatPrice(bookingData.total)}`}
                </span>
              </Button>

              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Bằng việc nhấn Thanh toán, bạn đồng ý với các Điều khoản &amp; Chính sách vé của CineBook.
              </p>
            </div>
        </div>
      </div>
    </div>
  )
}
