import { useMemo, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
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
  Navigation,
  Info,
  Building2,
  CreditCard,
  User,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { QrCodeDisplay } from '@/components/booking/qr-code-display'
import { AgeRatingBadge } from '@/components/movie/age-rating-badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_BOOKINGS, type MockBookingRecord } from '@/mocks/bookings'
import { MOCK_CINEMAS } from '@/mocks/cinemas'
import { formatPrice } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { BookingStatus } from '@/types/booking'
import { cn } from '@/lib/utils'

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
    sublabel: 'Vui lòng hoàn tất thanh toán',
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
    sublabel: 'Suất chiếu đã kết thúc',
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
  const location = useLocation()

  // 1. Tìm hoặc tổng hợp dữ liệu đơn vé
  const booking = useMemo<MockBookingRecord>(() => {
    // Ưu tiên dữ liệu từ location.state nếu có
    const stateData = location.state?.booking
    if (stateData) return stateData

    if (bookingId) {
      const q = bookingId.toLowerCase()
      const found = MOCK_BOOKINGS.find(
        (b) => b.bookingCode.toLowerCase() === q || b.id?.toLowerCase() === q
      )
      if (found) return found
    }

    // Fallback chân thực nếu truy cập trực tiếp bằng mã bất kỳ
    return {
      id: 'b-fallback',
      bookingCode: bookingId || 'CB-849201',
      movieTitle: 'Dune: Hành Tinh Cát - Phần Hai',
      poster:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      cinema: 'CineBook Landmark 81',
      room: 'Phòng chiếu 02 - ScreenX',
      showtime: '19:30 • 20/09/2026',
      seats: ['C5', 'C6'],
      total: 190000,
      status: 'CONFIRMED',
      category: 'upcoming',
      createdAt: '14/09/2026',
    }
  }, [bookingId, location.state])

  // Cập nhật tiêu đề trang
  useEffect(() => {
    document.title = `Vé điện tử ${booking.bookingCode} - ${booking.movieTitle} | CineBook`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [booking])

  // Tìm thông tin chi tiết cụm rạp để lấy địa chỉ và hotline
  const cinemaInfo = useMemo(() => {
    const found = MOCK_CINEMAS.find((c) =>
      booking.cinema.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(booking.cinema.toLowerCase())
    )
    return found || MOCK_CINEMAS[0]
  }, [booking.cinema])

  const statusMeta = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED
  const StatusIcon = statusMeta.icon

  // Trích xuất giờ và ngày từ chuỗi showtime (ví dụ: "19:30 • 20/09/2026")
  const [showTimeHour, showTimeDate] = useMemo(() => {
    if (booking.showtime.includes('•')) {
      const parts = booking.showtime.split('•').map((s) => s.trim())
      return [parts[0], parts[1]]
    }
    return [booking.showtime, '20/09/2026']
  }, [booking.showtime])

  // Tải file sự kiện lịch (.ics) hoặc mở Google Calendar
  const handleAddToCalendar = () => {
    const title = `Xem phim: ${booking.movieTitle} - CineBook`
    const desc = `Vé xem phim tại ${booking.cinema}, ${booking.room || 'Phòng chiếu'}. Ghế: ${booking.seats.join(', ')}. Mã vé: ${booking.bookingCode}`
    const locationStr = `${booking.cinema}, ${cinemaInfo.address}`

    // Mở Google Calendar event creator
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(locationStr)}`

    window.open(gCalUrl, '_blank')
    toast.success('Đã mở lịch nhắc nhở xem phim!')
  }

  // Chia sẻ vé điện tử
  const handleShareTicket = async () => {
    const shareData = {
      title: `Vé điện tử CineBook - ${booking.movieTitle}`,
      text: `Vé xem phim ${booking.movieTitle} tại ${booking.cinema}. Suất: ${booking.showtime}. Ghế: ${booking.seats.join(', ')}. Mã vé: ${booking.bookingCode}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    // Fallback: sao chép liên kết vé vào clipboard
    navigator.clipboard.writeText(window.location.href)
    toast.success('Đã sao chép liên kết vé vào bộ nhớ tạm!')
  }

  // In vé / Tải PDF
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* 1. THANH ĐIỀU HƯỚNG & HÀNH ĐỘNG NHANH (ẨN KHI IN ẤN) */}
      <div className="print:hidden space-y-4">
        {/* Breadcrumbs */}
        <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-xs text-muted-foreground">
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

      {/* ========================================================================= */}
      {/* 2. THẺ VÉ ĐIỆN TỬ CHÍNH (CINEMATIC BOARDING PASS / DIGITAL PASS)           */}
      {/* ========================================================================= */}
      <section
        aria-label="Vé điện tử xem phim"
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card text-card-foreground shadow-2xl backdrop-blur-md print:border print:shadow-none"
      >
        {/* Lớp nền ảnh phim mờ ảo tạo chiều sâu điện ảnh */}
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
          {/* =================================================================== */}
          {/* PHẦN CHÍNH (8 CỘT): THÔNG TIN PHIM, SUẤT CHIẾU, GHẾ NGỒI             */}
          {/* =================================================================== */}
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
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  • {statusMeta.sublabel}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Mã đặt vé:</span>
                <span className="font-mono text-base font-black text-primary tracking-wider">
                  {booking.bookingCode}
                </span>
                <CopyButton text={booking.bookingCode} title="Sao chép mã đặt vé" />
              </div>
            </div>

            {/* Poster & Tên phim */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Poster phim tỷ lệ 2:3 */}
              <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-md mx-auto sm:mx-0">
                <img
                  src={booking.poster}
                  alt={`Poster ${booking.movieTitle}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2 z-10">
                  <AgeRatingBadge ageRating="T16" size="sm" />
                </div>
              </div>

              {/* Thông tin phim */}
              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    ScreenX 2D
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Phụ đề Tiếng Việt
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">166 phút</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                  {booking.movieTitle}
                </h1>

                <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">{booking.cinema}</span>
                </p>

                {booking.room && (
                  <p className="text-xs text-muted-foreground font-medium">
                    {booking.room}
                  </p>
                )}
              </div>
            </div>

            {/* Khối Suất chiếu & Ghế ngồi (Card nổi bật) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-secondary/35 p-4 sm:p-5 backdrop-blur-xs">
              {/* Giờ chiếu */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>Giờ chiếu</span>
                </span>
                <p className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  {showTimeHour}
                </p>
              </div>

              {/* Ngày chiếu */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Ngày chiếu</span>
                </span>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {showTimeDate}
                </p>
              </div>

              {/* Ghế ngồi đã đặt */}
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Armchair className="h-3 w-3 text-primary" />
                  <span>Ghế ngồi ({booking.seats.length} vé)</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {booking.seats.map((seat) => (
                    <span
                      key={seat}
                      className="inline-flex items-center rounded-md border border-primary/40 bg-primary/20 px-2 py-0.5 font-mono text-xs sm:text-sm font-black text-primary shadow-xs"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Nhắc nhở check-in trước giờ chiếu */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/30 pt-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Vui lòng có mặt tại rạp trước giờ chiếu ít nhất <strong>15 phút</strong> để hoàn tất soát vé.
              </span>
            </div>
          </div>

          {/* =================================================================== */}
          {/* ĐƯỜNG ĐỤC LỖ & NOTCHES (Tear-off perforated line)                     */}
          {/* =================================================================== */}
          <div className="relative flex items-center justify-center lg:col-span-4 border-t lg:border-t-0 lg:border-l border-dashed border-border/80 bg-secondary/20 p-6 sm:p-8 flex-col text-center space-y-4">
            {/* Semicircular notches ở mép giao cắt */}
            <div className="absolute -top-3 lg:-top-3 lg:-left-3.5 h-7 w-7 rounded-full bg-background border border-border/80 z-20 pointer-events-none" />
            <div className="absolute -bottom-3 lg:-bottom-3 lg:-left-3.5 h-7 w-7 rounded-full bg-background border border-border/80 z-20 pointer-events-none" />

            {/* Tiêu đề stub */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Cổng Soát Vé Điện Tử
              </span>
              <h2 className="text-sm font-bold text-foreground">
                Quét Mã Để Vào Rạp
              </h2>
            </div>

            {/* SVG QR CODE & BARCODE COMPONENT */}
            <QrCodeDisplay
              value={booking.bookingCode}
              size={170}
              allowZoom={true}
              caption="Chạm để phóng to mã QR"
            />

            {/* Thông báo quét trực tiếp tại rạp */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-[11px] text-muted-foreground text-center space-y-1">
              <p className="font-semibold text-foreground">Không cần in vé giấy</p>
              <p>Nhân viên sẽ quét trực tiếp mã QR trên điện thoại của bạn tại cửa phòng chiếu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BẢNG THÔNG TIN CHI TIẾT & HỖ TRỢ (2 CỘT)                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
        {/* CỘT TRÁI (7 Cột): Chi tiết thanh toán & Người đặt vé */}
        <div className="md:col-span-7 space-y-6">
          {/* Khối Chi tiết thanh toán */}
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
                  {booking.seats.length} x {formatPrice(Math.round(booking.total / booking.seats.length))}
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

            {/* Thông tin phương thức & thời gian */}
            <div className="rounded-xl bg-secondary/40 p-3 text-xs space-y-1.5 border border-border/40">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Phương thức thanh toán:</span>
                <strong className="text-foreground font-semibold">VNPAY-QR</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Thời gian giao dịch:</span>
                <span className="text-foreground">{booking.createdAt || '14/09/2026 15:30'}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Trạng thái giao dịch:</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Thành công
                </span>
              </div>
            </div>
          </div>

          {/* Khối Thông tin người nhận vé */}
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Thông Tin Khách Hàng Nhận Vé</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-border/40 pt-3">
              <div className="flex items-start gap-2.5">
                <User className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Họ và tên</span>
                  <span className="font-semibold text-foreground">Nguyễn Văn An</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Số điện thoại</span>
                  <span className="font-semibold text-foreground">0912 345 678</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px]">Email nhận vé điện tử</span>
                  <span className="font-semibold text-foreground">nguyenvanan.cine@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 Cột): Địa điểm rạp, Chỉ đường & Quy định */}
        <div className="md:col-span-5 space-y-6">
          {/* Khối Địa chỉ rạp & Chỉ đường */}
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Địa Điểm Rạp Chiếu</span>
            </h3>

            <div className="space-y-3 border-t border-border/40 pt-3 text-xs">
              <div>
                <p className="font-bold text-sm text-foreground">{booking.cinema}</p>
                <p className="text-muted-foreground mt-0.5">{cinemaInfo.address}</p>
              </div>

              {cinemaInfo.hotline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>Hotline: <strong className="text-foreground">{cinemaInfo.hotline}</strong></span>
                </div>
              )}

              {cinemaInfo.mapUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs border-border/60 hover:bg-secondary cursor-pointer mt-2"
                >
                  <a
                    href={cinemaInfo.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở Google Maps chỉ đường tới ${booking.cinema}`}
                  >
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    <span>Mở Google Maps chỉ đường</span>
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Khối Quy định & Hướng dẫn rạp */}
          <div className="rounded-2xl border border-border/60 bg-card/80 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span>Quy Định Vào Phòng Chiếu</span>
            </h3>

            <ul className="space-y-2.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Xuất trình mã QR tại cửa soát vé để nhân viên quét mã vào rạp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  Phim phân loại <strong>T16</strong>: Khán giả từ 16 tuổi trở lên, vui lòng mang theo giấy tờ tùy thân (CCCD) khi được yêu cầu.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Không mang thức ăn, đồ uống có mùi từ bên ngoài vào rạp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Vé đã mua không hỗ trợ hủy hoặc hoàn tiền.</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Cần hỗ trợ đổi vé?</span>
              <a
                href={`tel:${cinemaInfo.hotline || '19006017'}`}
                className="font-bold text-primary hover:underline"
              >
                Gọi tổng đài hỗ trợ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
