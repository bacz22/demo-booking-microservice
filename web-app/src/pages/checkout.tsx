import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, User, Mail, Phone, AlertTriangle, Film } from 'lucide-react'
import { SeatHoldCountdown } from '@/components/booking/seat-hold-countdown'
import { BookingSummaryCard } from '@/components/booking/booking-summary-card'
import { PaymentMethodSelector } from '@/components/payment/payment-method-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatPrice } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useAuth } from '@/context/auth-context'
import { bookingApiService } from '@/services/booking-api.service'
import type { BackendBookingResponse } from '@/types/booking'
import type { PaymentMethodId } from '@/types/payment'

interface CheckoutLocationState {
  bookingId?: string
  booking?: BackendBookingResponse
  showtimeId?: string
  movieId?: string
  movieTitle?: string
  posterUrl?: string
  cinemaName?: string
  roomName?: string
  showtime?: string
  startTime?: string
  date?: string
  seats?: string[]
  total?: number
  format?: string
  ageRating?: string
}

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const state = location.state as CheckoutLocationState | null

  const bookingId = state?.bookingId || state?.booking?.id
  const hasValidBooking = Boolean(state?.movieTitle && state?.seats && state.seats.length > 0)

  // 1. Dữ liệu đơn đặt vé từ state chuyển tiếp của SeatSelectionPage
  const bookingData = useMemo(() => {
    if (!state || !state.movieTitle) {
      return {
        movieTitle: '',
        posterUrl: '',
        cinemaName: '',
        roomName: '',
        showtime: '',
        date: '',
        seats: [] as string[],
        subtotal: 0,
        serviceFee: 0,
        total: 0,
        format: '2D',
        ageRating: 'P',
      }
    }

    return {
      movieTitle: state.movieTitle,
      posterUrl: state.posterUrl || '',
      cinemaName: state.cinemaName || 'Rạp CineBook',
      roomName: state.roomName || 'Phòng chiếu tiêu chuẩn',
      showtime: state.showtime || '10:00',
      date: state.date || 'Hôm nay',
      seats: state.seats || [],
      subtotal: state.total || 0,
      serviceFee: 0,
      total: state.total || 0,
      format: state.format || '2D',
      ageRating: state.ageRating || 'P',
    }
  }, [state])

  // 2. Thời điểm hết hạn giữ vé từ Backend (expiresAt ISO-8601)
  const initialExpiresAt = useMemo<number>(() => {
    if (state?.booking?.expiresAt) {
      const ms = new Date(state.booking.expiresAt).getTime()
      if (!isNaN(ms) && ms > Date.now()) {
        return ms
      }
    }
    return Date.now() + 5 * 60 * 1000
  }, [state?.booking?.expiresAt])

  const [expiresAt] = useState<number>(initialExpiresAt)
  const [isExpired, setIsExpired] = useState(false)

  // 3. Phương thức thanh toán được chọn (Mặc định: vnpay)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('vnpay')

  // 4. Thông tin người nhận vé (Tự động điền theo thông tin user nếu có)
  const [customerInfo, setCustomerInfo] = useState({
    fullName: user?.fullName || 'Nguyễn Văn An',
    email: user?.email || 'demo@cinebook.vn',
    phone: user?.phone || '0912 345 678',
  })

  // 5. Trạng thái Loading khi click thanh toán & Modal xác nhận hủy
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = 'Thanh toán vé xem phim | CineBook'
  }, [])

  // Xử lý khi nhấn nút CTA "Thanh toán"
  const handlePayment = async () => {
    if (isExpired || isProcessing) return

    if (!bookingId) {
      toast.error('Không tìm thấy mã đơn giữ chỗ. Vui lòng chọn lại ghế.')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Gọi Booking Service POST /api/bookings/{id}/confirm (Mock Payment)
      const confirmed = await bookingApiService.confirmBooking(bookingId)

      toast.bookingSuccess({
        bookingCode: confirmed.bookingCode,
        movieTitle: bookingData.movieTitle,
        seats: bookingData.seats,
      })

      // 2. Điều hướng sang trang thanh toán thành công
      navigate('/payment/success', {
        state: {
          bookingId: confirmed.id,
          bookingCode: confirmed.bookingCode,
          movie: bookingData.movieTitle,
          cinema: bookingData.cinemaName,
          room: bookingData.roomName,
          showtime: `${bookingData.showtime} • ${bookingData.date}`,
          seats: bookingData.seats,
          total: Number(confirmed.totalAmount) || bookingData.total,
          paymentMethod,
        },
      })
    } catch (err: any) {
      console.error('Lỗi xác nhận thanh toán:', err)

      if (err?.code === 'BOOKING_EXPIRED') {
        setIsExpired(true)
        toast.error('Đơn giữ vé đã hết hạn giữ chỗ (quá 5 phút). Ghế đã được nhả ra.')
      } else if (err?.code === 'MOCK_PAYMENT_DISABLED') {
        toast.error('Tính năng thanh toán thử nghiệm chưa được bật trên máy chủ.')
      } else if (err?.code === 'SHOWTIME_NOT_SELLING') {
        toast.error('Suất chiếu này đã ngừng bán vé.')
        navigate(state?.showtimeId ? `/booking/${state.showtimeId}/seats` : '/cinemas')
      } else {
        toast.paymentError(err?.message || 'Giao dịch thanh toán không thành công.')
        navigate('/payment/failed', {
          state: {
            bookingId,
            movie: bookingData.movieTitle,
            cinema: bookingData.cinemaName,
            total: bookingData.total,
            reason: err?.message || 'Giao dịch không thành công hoặc lỗi kết nối cổng thanh toán',
          },
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Mở modal xác nhận hủy đơn giữ chỗ
  const handleRequestCancel = () => {
    if (!bookingId) {
      navigate(state?.showtimeId ? `/booking/${state.showtimeId}/seats` : '/cinemas')
      return
    }
    setIsCancelModalOpen(true)
  }

  // Xử lý hủy đơn giữ chỗ chủ động khi user bấm xác nhận trong ConfirmDialog
  const handleConfirmCancel = async () => {
    if (!bookingId) return

    setIsCancelling(true)
    try {
      await bookingApiService.cancelBooking(bookingId)
      toast.info('Đã hủy đơn giữ chỗ và giải phóng ghế thành công.')
      setIsCancelModalOpen(false)
      navigate(state?.showtimeId ? `/booking/${state.showtimeId}/seats` : '/cinemas')
    } catch (err: any) {
      console.warn('Lỗi khi hủy đơn:', err)
      toast.error(err?.message || 'Không thể hủy đơn. Có thể đơn đã hết hạn.')
      setIsCancelModalOpen(false)
      navigate(state?.showtimeId ? `/booking/${state.showtimeId}/seats` : '/cinemas')
    } finally {
      setIsCancelling(false)
    }
  }

  // Nếu không có thông tin đặt vé hợp lệ, hiển thị thông báo EmptyState
  if (!hasValidBooking) {
    return (
      <div className="space-y-6 pb-16">
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
          title="Chưa có thông tin vé cần thanh toán"
          description="Bạn chưa chọn vé hoặc phiên làm việc đã kết thúc. Vui lòng chọn phim và ghế ngồi để tiếp tục đặt vé."
          action={{
            label: 'Khám phá phim & lịch chiếu',
            href: '/cinemas',
          }}
          className="py-16"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-16">
      {/* Nút quay lại */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleRequestCancel}
          disabled={isProcessing || isCancelling}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại chọn ghế</span>
        </button>

        {bookingId && (
          <span className="text-xs text-muted-foreground font-mono">
            Mã đơn: <strong className="text-foreground">{state?.booking?.bookingCode || bookingId.slice(0, 8)}</strong>
          </span>
        )}
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
            toast.paymentError('Thời gian giữ vé đã kết thúc. Ghế đã được giải phóng.')
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
              <strong>Thời gian giữ ghế đã hết hạn!</strong> Ghế của bạn đã được hệ thống giải phóng cho khách hàng khác.
            </span>
          </div>
          <Link
            to={state?.showtimeId ? `/booking/${state.showtimeId}/seats` : '/cinemas'}
            className="shrink-0 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90"
          >
            Chọn lại ghế
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
                  disabled={isProcessing || isCancelling}
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
                  disabled={isProcessing || isCancelling}
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
                  disabled={isProcessing || isCancelling}
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
              disabled={isProcessing || isExpired || isCancelling}
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
            ticketPrice={bookingData.seats.length > 0 ? Math.round(bookingData.total / bookingData.seats.length) : undefined}
            subtotal={bookingData.subtotal}
            serviceFee={bookingData.serviceFee}
            total={bookingData.total}
            format={bookingData.format}
            ageRating={bookingData.ageRating}
          />

          {/* CTA Nút Thanh toán */}
          <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-lg backdrop-blur-md space-y-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={isProcessing}
              disabled={isExpired || isProcessing || isCancelling || bookingData.seats.length === 0}
              onClick={handlePayment}
              className="w-full font-bold text-base shadow-xl shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>
                {isProcessing
                  ? 'Đang xác nhận thanh toán...'
                  : `Thanh toán ${formatPrice(bookingData.total)}`}
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isProcessing || isCancelling}
              onClick={handleRequestCancel}
              className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              {isCancelling ? 'Đang hủy giữ chỗ...' : 'Hủy đơn giữ chỗ'}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Bằng việc nhấn Thanh toán, bạn đồng ý với các Điều khoản &amp; Chính sách vé của CineBook.
            </p>
          </div>
        </div>
      </div>

      {/* Modal xác nhận Hủy đơn giữ chỗ với UI hiện đại */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        title="Hủy đơn giữ chỗ vé xem phim?"
        description="Bạn có chắc chắn muốn hủy đơn giữ chỗ này không? Ghế bạn đã chọn sẽ được giải phóng ngay lập tức để những khán giả khác có thể đặt mua."
        warningNote="Thao tác này không thể hoàn tác. Bạn sẽ cần chọn lại ghế nếu muốn tiếp tục đặt vé."
        confirmText="Hủy giữ chỗ"
        cancelText="Tiếp tục thanh toán"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (!isCancelling) setIsCancelModalOpen(false)
        }}
      />
    </div>
  )
}
