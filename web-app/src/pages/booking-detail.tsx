import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Armchair,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  CreditCard,
  Phone,
  AlertTriangle,
} from 'lucide-react'
import { QrCodeDisplay } from '@/components/booking/qr-code-display'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatPrice } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { BookingStatus, BookingHistoryItem } from '@/types/booking'
import { bookingApiService } from '@/services/booking-api.service'
import { movieApiService } from '@/services/movie-api.service'
import { theaterApiService } from '@/services/theater-api.service'
import { showtimeApiService } from '@/services/showtime-api.service'
import { cn } from '@/lib/utils'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface StatusInfo {
  label: string
  sublabel: string
  className: string
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
  icon: React.ComponentType<{ className?: string }>
}

const STATUS_CONFIG: Record<BookingStatus, StatusInfo> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    sublabel: 'Sẵn sàng vào phòng chiếu',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    badgeVariant: 'default',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Chờ thanh toán',
    sublabel: 'Vui lòng hoàn tất thanh toán trước khi hết hạn giữ chỗ',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    badgeVariant: 'secondary',
    icon: Clock,
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    sublabel: 'Vui lòng hoàn tất thanh toán trước khi hết hạn giữ chỗ',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    badgeVariant: 'secondary',
    icon: Clock,
  },
  CANCELLED: {
    label: 'Đã hủy',
    sublabel: 'Giao dịch đã được hủy',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    badgeVariant: 'destructive',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    sublabel: 'Thời gian giữ chỗ đã hết hạn',
    className: 'bg-muted/30 text-muted-foreground border-border/50',
    badgeVariant: 'outline',
    icon: AlertCircle,
  },
  PAYMENT_FAILED: {
    label: 'Thanh toán thất bại',
    sublabel: 'Giao dịch không thành công',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    badgeVariant: 'destructive',
    icon: XCircle,
  },
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()

  const [liveBooking, setLiveBooking] = useState<BookingHistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(bookingId && UUID_REGEX.test(bookingId)))
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  const [theaterInfo, setTheaterInfo] = useState<{ address: string; hotline: string } | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  // 1. Tải dữ liệu booking thực tế từ Booking Service API (không còn dữ liệu mẫu)
  useEffect(() => {
    if (!bookingId || !UUID_REGEX.test(bookingId)) {
      setLoadFailed(true)
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setLoadFailed(false)

    bookingApiService
      .getBookingById(bookingId)
      .then(async (b) => {
        if (isCancelled) return

        // Ưu tiên snapshot lưu trong booking; chỉ gọi API khác khi snapshot thiếu
        let movieTitle = b.movieTitle || ''
        let poster = b.posterUrl || ''
        let cinema = b.theaterName || ''
        let room = b.auditoriumName || ''
        let showtimeStart = b.showtimeStart || ''

        const [mv, th, st] = await Promise.all([
          (!movieTitle || !poster) && b.movieId
            ? movieApiService.getMovieById(b.movieId).catch(() => null)
            : Promise.resolve(null),
          b.theaterId ? theaterApiService.getPublicTheaterById(b.theaterId).catch(() => null) : Promise.resolve(null),
          (!showtimeStart || !room) && b.showtimeId
            ? showtimeApiService.getPublicShowtimeById(b.showtimeId).catch(() => null)
            : Promise.resolve(null),
        ])
        if (isCancelled) return

        if (mv) {
          movieTitle = movieTitle || mv.title
          poster = poster || mv.posterUrl
        }
        if (th) {
          cinema = cinema || th.name
          setTheaterInfo({ address: th.address, hotline: th.hotline })
        }
        if (st) {
          showtimeStart = showtimeStart || st.startTime
          room = room || st.auditoriumName
          cinema = cinema || st.theaterName
        }

        let showtime = ''
        if (showtimeStart) {
          const d = new Date(showtimeStart)
          const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
          showtime = `${time} • ${date}`
        }

        const item = bookingApiService.mapBackendBookingToHistoryItem(b, {
          movieTitle: movieTitle || undefined,
          poster: poster || undefined,
          cinema: cinema || undefined,
          room: room || undefined,
          showtime: showtime || undefined,
        })

        setLiveBooking(item)
      })
      .catch((err) => {
        console.warn('Không thể nạp chi tiết đơn đặt vé từ backend:', err)
        if (!isCancelled) setLoadFailed(true)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [bookingId])

  const booking = liveBooking

  // Cập nhật tiêu đề trang
  useEffect(() => {
    if (!booking) return
    document.title = `Vé điện tử ${booking.bookingCode} - ${booking.movieTitle} | CineBook`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [booking])

  // Trích xuất giờ và ngày từ chuỗi showtime
  const [showTimeHour, showTimeDate] = useMemo(() => {
    const value = booking?.showtime ?? ''
    if (value.includes('•')) {
      const parts = value.split('•').map((s) => s.trim())
      return [parts[0], parts[1]]
    }
    return [value, '']
  }, [booking?.showtime])

  // Tải file sự kiện lịch hoặc mở Google Calendar
  const handleAddToCalendar = () => {
    if (!booking) return
    const title = `Xem phim: ${booking.movieTitle} - CineBook`
    const desc = `Vé xem phim tại ${booking.cinema}, ${booking.room || 'Phòng chiếu'}. Ghế: ${booking.seats.join(', ')}. Mã vé: ${booking.bookingCode}`
    const locationStr = theaterInfo?.address ? `${booking.cinema}, ${theaterInfo.address}` : booking.cinema

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(locationStr)}`

    window.open(gCalUrl, '_blank')
    toast.success('Đã mở lịch nhắc nhở xem phim!')
  }

  // Chia sẻ vé điện tử
  const handleShareTicket = async () => {
    if (!booking) return
    const shareData = {
      title: `Vé xem phim: ${booking.movieTitle}`,
      text: `Tôi đã đặt vé xem phim ${booking.movieTitle} tại ${booking.cinema} vào lúc ${booking.showtime}. Ghế: ${booking.seats.join(', ')}!`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        toast.success('Đã mở hộp thoại chia sẻ!')
      } catch {
        // người dùng hủy chia sẻ
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${shareData.text}\nXem chi tiết tại: ${shareData.url}`
        )
        toast.success('Đã sao chép liên kết vé vào bộ nhớ tạm!')
      } catch {
        toast.error('Không thể chia sẻ hoặc sao chép liên kết.')
      }
    }
  }

  // In vé hoặc lưu PDF
  const handlePrint = () => {
    window.print()
  }

  // Mở modal xác nhận hủy đơn giữ chỗ
  const handleRequestCancel = () => {
    if (!booking) return
    if (!booking.id || !UUID_REGEX.test(booking.id)) {
      toast.error('Không thể hủy đơn vé này.')
      return
    }
    setIsCancelDialogOpen(true)
  }

  // Thực hiện hủy đơn sau khi user đã xác nhận trong ConfirmDialog
  const handleConfirmCancel = async () => {
    if (!booking) return
    if (!booking.id || !UUID_REGEX.test(booking.id)) return

    setIsCancelling(true)
    try {
      const cancelled = await bookingApiService.cancelBooking(booking.id)
      setLiveBooking((prev) =>
        prev
          ? {
              ...prev,
              status: 'CANCELLED',
              cancelledAt: cancelled.cancelledAt || new Date().toISOString(),
            }
          : null
      )
      toast.success('Đã hủy đơn giữ chỗ vé thành công.')
      setIsCancelDialogOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Không thể hủy đơn vé.')
      setIsCancelDialogOpen(false)
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
        <Skeleton className="h-6 w-36 rounded-md" />
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  if (!booking || loadFailed) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy vé</h1>
        <p className="text-sm text-muted-foreground">
          Không thể tải thông tin đơn đặt vé này. Vé có thể không tồn tại hoặc không thuộc tài khoản của bạn.
        </p>
        <Button asChild variant="outline">
          <Link to="/my-bookings">Quay lại Vé của tôi</Link>
        </Button>
      </div>
    )
  }

  const statusMeta = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED
  const StatusIcon = statusMeta.icon
  const isPending = booking.status === 'PENDING' || booking.status === 'PENDING_PAYMENT'

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* 1. THANH ĐIỀU HƯỚNG & HÀNH ĐỘNG ĐẦU TRANG */}
      <div className="space-y-3 print:hidden">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/my-bookings" className="hover:text-foreground transition-colors">
            Vé của tôi
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">Mã vé {booking.bookingCode}</span>
        </nav>

        {/* Header với nút quay lại & cụm công cụ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại danh sách vé</span>
          </Link>

          {/* Cụm công cụ: In vé, Chia sẻ, Thêm vào lịch */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddToCalendar}
              className="h-8 gap-1.5 text-xs border-border/60 hover:bg-secondary cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Thêm lịch</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareTicket}
              className="h-8 gap-1.5 text-xs border-border/60 hover:bg-secondary cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Chia sẻ</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In vé / Lưu PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Thông báo nếu vé đang ở trạng thái giữ chỗ tạm thời (PENDING_PAYMENT) */}
      {isPending && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-warning/50 bg-warning/10 text-warning animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              Đơn vé đang ở trạng thái <strong>Chờ thanh toán</strong> (được giữ trong 5 phút).
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={handleRequestCancel}
              className="text-xs border-warning/40 hover:bg-warning/20 text-warning"
            >
              {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                navigate('/checkout', {
                  state: {
                    bookingId: booking.id,
                    movieTitle: booking.movieTitle,
                    cinemaName: booking.cinema,
                    roomName: booking.room,
                    showtime: booking.showtime,
                    seats: booking.seats,
                    total: booking.total,
                  },
                })
              }
              className="text-xs font-bold"
            >
              Tiếp tục thanh toán
            </Button>
          </div>
        </div>
      )}

      {/* 2. THẺ VÉ ĐIỆN TỬ CHÍNH (CINEMATIC BOARDING PASS) */}
      <section
        aria-label="Vé điện tử xem phim"
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card text-card-foreground shadow-2xl backdrop-blur-md print:border print:shadow-none"
      >
        {/* Lớp nền ảnh phim mờ ảo */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden">
          <img
            src={booking.poster}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover blur-2xl scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-card/80 via-card/95 to-card" />
        </div>

        {/* NỘI DUNG VÉ: CHIA 2 PHẦN THEO ĐƯỜNG ĐỤC LỖ */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
          {/* PHẦN CHÍNH (8 CỘT) */}
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            {/* Header thẻ vé: Huy hiệu trạng thái & Mã vé */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide',
                    statusMeta.className
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span>{statusMeta.label}</span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  • {statusMeta.sublabel}
                </span>
              </div>

              {/* Mã vé & Nút sao chép */}
              <div className="flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-1.5 border border-border/50">
                <span className="text-[11px] text-muted-foreground font-mono">MÃ VÉ:</span>
                <span className="font-mono font-black text-sm text-foreground tracking-wider">
                  {booking.bookingCode}
                </span>
                <CopyButton text={booking.bookingCode} title="Sao chép mã vé" />
              </div>
            </div>

            {/* Thông tin phim */}
            <div className="flex gap-4 sm:gap-6 items-start">
              <div className="relative shrink-0 rounded-2xl overflow-hidden border border-border/60 shadow-lg w-24 sm:w-28 aspect-[2/3] bg-muted">
                <img
                  src={booking.poster}
                  alt={booking.movieTitle}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AgeRatingBadge ageRating="T16" />
                  <Badge variant="outline" className="text-[11px] font-semibold border-border/60">
                    2D Phụ Đề
                  </Badge>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight line-clamp-2">
                  {booking.movieTitle}
                </h1>

                <p className="text-xs sm:text-sm font-semibold text-primary">
                  {booking.cinema}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.room || 'Phòng chiếu tiêu chuẩn'}
                </p>
              </div>
            </div>

            {/* Khối Thông tin Suất Chiếu & Ghế Ngồi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-secondary/40 border border-border/50 backdrop-blur-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>Giờ chiếu</span>
                </span>
                <strong className="text-sm sm:text-base font-black text-foreground">
                  {showTimeHour}
                </strong>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Ngày chiếu</span>
                </span>
                <strong className="text-sm sm:text-base font-black text-foreground">
                  {showTimeDate}
                </strong>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                  <Armchair className="h-3 w-3 text-primary" />
                  <span>Ghế ngồi</span>
                </span>
                <strong className="text-sm sm:text-base font-black text-primary">
                  {booking.seats.join(', ')}
                </strong>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-primary" />
                  <span>Phòng chiếu</span>
                </span>
                <strong className="text-sm sm:text-base font-black text-foreground truncate block">
                  {booking.room ? booking.room.replace('Phòng chiếu ', 'Phòng ') : 'P.02'}
                </strong>
              </div>
            </div>
          </div>

          {/* PHẦN CUỐNG VÉ (4 CỘT): MÃ QR SOÁT VÉ */}
          <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col items-center justify-center gap-5 border-t lg:border-t-0 lg:border-l border-dashed border-border/80 bg-secondary/20 relative">
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Cổng Soát Vé Điện Tử
              </span>
              <h2 className="text-sm font-bold text-foreground">
                Quét Mã Để Vào Rạp
              </h2>
            </div>

            <QrCodeDisplay
              value={booking.bookingCode}
              size={170}
              allowZoom={true}
              caption="Chạm để phóng to mã QR"
            />

            <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-[11px] text-muted-foreground text-center space-y-1">
              <p className="font-semibold text-foreground">Không cần in vé giấy</p>
              <p>Nhân viên sẽ quét trực tiếp mã QR trên điện thoại của bạn tại cửa phòng chiếu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BẢNG THÔNG TIN CHI TIẾT & HỖ TRỢ (2 CỘT) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
        {/* CỘT TRÁI: Chi tiết thanh toán & Khách hàng */}
        <div className="md:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Chi Tiết Thanh Toán</span>
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm border-t border-border/40 pt-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Vé xem phim ({booking.seats.length} vé)</span>
                <span className="font-medium text-foreground">
                  {formatPrice(booking.total)}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Ghế ({booking.seats.join(', ')})</span>
                <span className="font-medium text-foreground">
                  {booking.seats.length} x{' '}
                  {formatPrice(
                    booking.seats.length > 0 ? Math.round(booking.total / booking.seats.length) : booking.total
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Phí dịch vụ &amp; tiện ích</span>
                <span className="font-medium text-emerald-500">Miễn phí</span>
              </div>

              <div className="border-t border-dashed border-border/60 pt-3 flex items-baseline justify-between">
                <span className="text-sm font-bold text-foreground">Tổng tiền thanh toán</span>
                <span className="text-xl font-black text-primary">
                  {formatPrice(booking.total)}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/40 p-3 text-xs space-y-1.5 border border-border/40">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Phương thức thanh toán:</span>
                <strong className="text-foreground font-semibold">Thanh toán trực tuyến</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Thời gian giao dịch:</span>
                <span className="text-foreground">{booking.createdAt || 'Hôm nay'}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Trạng thái:</span>
                <span
                  className={cn(
                    'font-semibold flex items-center gap-1',
                    booking.status === 'CONFIRMED' ? 'text-emerald-500' : 'text-warning'
                  )}
                >
                  <StatusIcon className="h-3 w-3" /> {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Địa điểm rạp & Quy định */}
        <div className="md:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Địa Điểm Rạp Chiếu</span>
            </h3>

            <div className="space-y-3 border-t border-border/40 pt-3 text-xs">
              <div>
                <p className="font-bold text-sm text-foreground">{booking.cinema}</p>
                {theaterInfo?.address && (
                  <p className="text-muted-foreground mt-0.5">{theaterInfo.address}</p>
                )}
              </div>

              {theaterInfo?.hotline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Hotline: <strong className="text-foreground">{theaterInfo.hotline}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận Hủy vé */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        title="Hủy đơn giữ chỗ vé xem phim?"
        description="Bạn có chắc chắn muốn hủy đơn đặt vé này không? Sau khi hủy, ghế sẽ được giải phóng ngay lập tức cho những khán giả khác."
        warningNote="Thao tác này không thể hoàn tác."
        confirmText="Đồng ý hủy vé"
        cancelText="Đóng"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (!isCancelling) setIsCancelDialogOpen(false)
        }}
      />
    </div>
  )
}
