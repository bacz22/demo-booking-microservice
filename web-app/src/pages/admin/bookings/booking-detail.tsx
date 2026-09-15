import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Copy,
  Check,
  RotateCcw,
  Ban,
  User,
  Film,
  CreditCard,
  Ticket,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
} from 'lucide-react'
import type { AdminBooking } from '@/types/admin-booking'
import {
  getAdminBookingById,
  cancelAdminBooking,
  requestRefundBooking,
} from '@/mocks/admin/bookings'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminBookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>()

  const [booking, setBooking] = useState<AdminBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Technical metadata collapse state
  const [showMetadata, setShowMetadata] = useState(true)

  // Actions dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    setLoading(true)
    try {
      const data = getAdminBookingById(bookingId)
      setBooking(data)
    } catch (err) {
      console.error('Failed to load booking detail:', err)
      toast.error('Không thể tải thông tin đơn đặt vé')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyName)
    toast.success(`Đã sao chép ${keyName}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCancelBooking = () => {
    if (!booking) return
    setIsCancelling(true)
    try {
      const res = cancelAdminBooking(booking.id, cancelReason)
      if (res.success && res.booking) {
        setBooking(res.booking)
        toast.success(res.message)
        setShowCancelDialog(false)
        setCancelReason('')
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi hủy vé')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRefundBooking = () => {
    if (!booking) return
    setIsRefunding(true)
    try {
      const res = requestRefundBooking(booking.id, refundReason)
      if (res.success && res.booking) {
        setBooking(res.booking)
        toast.success(res.message)
        setShowRefundDialog(false)
        setRefundReason('')
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo yêu cầu hoàn tiền')
    } finally {
      setIsRefunding(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary/50 rounded-xl" />
        <div className="h-24 w-full bg-secondary/30 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-secondary/20 rounded-2xl" />
          <div className="h-96 bg-secondary/20 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
          <Ban className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy đơn đặt vé</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Mã đơn đặt vé &quot;{bookingId}&quot; không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/admin/bookings">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  // State guards for action buttons per prompt.txt
  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT'
  const canRefund = booking.payment.status === 'SUCCESS' && booking.status === 'CONFIRMED'

  const cancelDisabledReason =
    booking.status === 'CANCELLED'
      ? 'Đơn đặt vé này đã bị hủy trước đó'
      : booking.status === 'REFUNDED'
      ? 'Đơn đặt vé đã hoàn tất hoàn tiền, không thể hủy'
      : booking.status === 'EXPIRED'
      ? 'Đơn đặt vé đã hết hạn thanh toán'
      : undefined

  const refundDisabledReason =
    booking.status === 'REFUND_PENDING'
      ? 'Đơn đặt vé đang trong tiến trình đối soát hoàn tiền'
      : booking.status === 'REFUNDED'
      ? 'Đơn đặt vé đã được hoàn tiền thành công'
      : booking.status === 'CANCELLED'
      ? 'Đơn đặt vé đã bị hủy, không thể yêu cầu hoàn tiền'
      : booking.payment.status !== 'SUCCESS'
      ? 'Chỉ có thể hoàn tiền cho đơn đã thanh toán thành công'
      : undefined

  return (
    <div className="space-y-6">
      {/* Top Header Bar with Back Link and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Link to="/admin/bookings">
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span>Danh sách đặt vé</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">
              Tạo lúc: {booking.createdAt}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-foreground flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary" />
              <span>Đơn Đặt Vé:</span>
              <span className="font-mono text-primary font-bold">{booking.bookingCode}</span>
            </h1>

            <button
              type="button"
              onClick={() => copyToClipboard(booking.bookingCode, 'Mã booking')}
              className="p-1.5 rounded-lg border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Sao chép mã đơn"
            >
              {copiedKey === 'Mã booking' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <AdminStatusBadge status={booking.status} size="md" />
          </div>
        </div>

        {/* Action Buttons with state guards */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refund Action */}
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canRefund}
              onClick={() => setShowRefundDialog(true)}
              className="h-9 gap-1.5 rounded-xl border-sky-500/30 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yêu cầu hoàn tiền</span>
            </Button>
            {!canRefund && refundDisabledReason && (
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-20 w-64 p-2 rounded-xl bg-popover border border-border/80 text-[11px] text-muted-foreground shadow-xl">
                {refundDisabledReason}
              </div>
            )}
          </div>

          {/* Cancel Action */}
          <div className="relative group">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!canCancel}
              onClick={() => setShowCancelDialog(true)}
              className="h-9 gap-1.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Hủy đơn đặt vé</span>
            </Button>
            {!canCancel && cancelDisabledReason && (
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-20 w-64 p-2 rounded-xl bg-popover border border-border/80 text-[11px] text-muted-foreground shadow-xl">
                {cancelDisabledReason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Movie Snapshot & Booking Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Zone 1: Movie, Theater & Seat Snapshot Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                <span>Thông tin suất chiếu & Ghế đặt</span>
              </h2>
              <span className="text-xs font-mono font-bold text-primary">
                {booking.seats.length} ghế
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={booking.movie.posterUrl}
                alt={booking.movie.title}
                className="w-24 h-36 rounded-xl object-cover border border-border/80 shadow-md shrink-0 mx-auto sm:mx-0"
              />

              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-black font-heading text-foreground">
                      {booking.movie.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
                      {booking.movie.ageRating}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Thời lượng: {booking.movie.duration} phút • {booking.movie.format} •{' '}
                    {booking.movie.language}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-secondary/30 p-3 rounded-xl border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Cụm rạp & Phòng</span>
                    <span className="font-bold text-foreground block">
                      {booking.theater.name}
                    </span>
                    <span className="text-primary font-semibold text-[11px]">
                      {booking.theater.auditoriumName}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ngày & Giờ chiếu</span>
                    <span className="font-bold text-foreground block font-mono">
                      {formatDate(booking.showtime.date)}
                    </span>
                    <span className="text-primary font-semibold text-[11px] font-mono">
                      {booking.showtime.startTime} - {booking.showtime.endTime}
                    </span>
                  </div>
                </div>

                {/* Selected Seats */}
                <div>
                  <span className="text-xs text-muted-foreground block mb-1.5 font-medium">
                    Vị trí ghế đã chọn:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {booking.seats.map((seat) => (
                      <div
                        key={seat.seatId}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold shadow-2xs',
                          seat.type === 'vip'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : seat.type === 'couple'
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                            : 'bg-secondary border-border/80 text-foreground'
                        )}
                      >
                        <span>{seat.seatNumber}</span>
                        <span className="text-[10px] opacity-75 font-normal">
                          ({seat.type === 'vip' ? 'VIP' : seat.type === 'couple' ? 'Đôi' : 'Thường'})
                        </span>
                        <span className="text-[11px] text-muted-foreground border-l border-border/60 pl-1.5 ml-0.5">
                          {formatVND(seat.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone 2: Booking State Transition Timeline */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Vòng đời đơn hàng (State Transitions)</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {booking.timeline.length} sự kiện
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
              {booking.timeline.map((event, index) => {
                const isLatest = index === 0

                return (
                  <div key={event.id} className="relative space-y-1">
                    {/* Event Dot */}
                    <div
                      className={cn(
                        'absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-card',
                        isLatest
                          ? 'border-primary text-primary shadow-xs ring-4 ring-primary/10'
                          : 'border-muted-foreground/40 text-muted-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          isLatest ? 'bg-primary' : 'bg-muted-foreground/50'
                        )}
                      />
                    </div>

                    {/* Event Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{event.title}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase',
                            event.actor === 'USER'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : event.actor === 'ADMIN'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          )}
                        >
                          {event.actor}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-muted-foreground">
                        {event.timestamp}
                      </span>
                    </div>

                    {/* Event Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>

                    {/* Correlation ID if present */}
                    {event.correlationId && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Trace: {event.correlationId}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer, Payment Breakdown, Technical Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="w-4 h-4 text-primary" />
              <span>Thông tin khách hàng</span>
            </h2>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-black font-heading text-primary text-base shrink-0">
                {booking.customer.fullName.charAt(0)}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm truncate">
                    {booking.customer.fullName}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-400">
                    {booking.customer.membershipTier}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {booking.customer.email}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {booking.customer.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Invoice Breakdown */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Chi tiết thanh toán</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Tiền vé ({booking.seats.length} ghế)</span>
                <span className="font-mono font-bold text-foreground">
                  {formatVND(booking.pricing.seatsTotal)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Combo bắp nước & snack</span>
                <span className="font-mono font-bold text-foreground">
                  {formatVND(booking.pricing.comboSnackTotal)}
                </span>
              </div>

              {booking.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Giảm giá / Voucher</span>
                  <span className="font-mono font-bold">
                    - {formatVND(booking.pricing.discountAmount)}
                  </span>
                </div>
              )}

              <div className="border-t border-border/60 pt-2.5 flex justify-between items-baseline">
                <span className="font-bold text-foreground text-sm">Tổng tiền thanh toán</span>
                <span className="font-mono font-black text-lg text-primary tabular-nums">
                  {formatVND(booking.pricing.finalTotal)}
                </span>
              </div>
            </div>

            {/* Payment Gateway info box */}
            <div className="rounded-xl bg-secondary/30 p-3.5 border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Phương thức:</span>
                <span className="font-mono font-bold text-foreground">
                  {booking.payment.method}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trạng thái cổng:</span>
                <span
                  className={cn(
                    'font-semibold',
                    booking.payment.status === 'SUCCESS'
                      ? 'text-emerald-400'
                      : booking.payment.status === 'PENDING'
                      ? 'text-amber-400'
                      : booking.payment.status === 'REFUNDED'
                      ? 'text-indigo-400'
                      : 'text-rose-400'
                  )}
                >
                  {booking.payment.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mã đối soát:</span>
                <span className="font-mono text-muted-foreground truncate max-w-[170px]">
                  {booking.payment.providerRef}
                </span>
              </div>
              {booking.payment.paidAt && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Thời gian trừ tiền:</span>
                  <span className="font-mono text-muted-foreground">
                    {booking.payment.paidAt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Technical Metadata */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Metadata Kỹ Thuật (Kafka / Microservices)
                </span>
              </div>
              {showMetadata ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showMetadata && (
              <div className="p-4 pt-0 border-t border-border/60 bg-secondary/10 space-y-2.5 text-xs">
                {/* Kafka Info */}
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Kafka Topic:</span>
                  <span className="font-mono text-primary font-bold text-[11px]">
                    {booking.metadata.kafkaTopic}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Partition & Offset:</span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    p={booking.metadata.kafkaPartition} | offset={booking.metadata.kafkaOffset}
                  </span>
                </div>

                {/* Correlation ID */}
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Correlation ID:</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[140px]">{booking.metadata.correlationId}</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(booking.metadata.correlationId, 'Correlation ID')
                      }
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiedKey === 'Correlation ID' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Booking ID */}
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Internal Booking ID:</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <span>{booking.metadata.bookingId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(booking.metadata.bookingId, 'Booking ID')}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiedKey === 'Booking ID' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* User ID */}
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {booking.metadata.userId}
                  </span>
                </div>

                {/* Showtime ID */}
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Showtime ID:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {booking.metadata.showtimeId}
                  </span>
                </div>

                {/* Client IP & User Agent */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">IP Khách Hàng:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {booking.metadata.ipAddress}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AdminConfirmDialog
        isOpen={showCancelDialog}
        title="Xác nhận hủy đơn đặt vé"
        targetName={booking.bookingCode}
        description={`Bạn chuẩn bị hủy đơn đặt vé của khách hàng ${booking.customer.fullName}. Hành động này sẽ chuyển trạng thái booking sang CANCELLED.`}
        consequenceWarning="Toàn bộ ghế ngồi trong đơn vé sẽ được giải phóng ngay lập tức. Hệ thống sẽ phát hành event Kafka hủy vé và gửi thông báo hoàn tất đến khách hàng."
        confirmText="Hủy đơn đặt vé"
        cancelText="Đóng"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => {
          setShowCancelDialog(false)
          setCancelReason('')
        }}
      />

      {/* Refund Dialog */}
      <AdminConfirmDialog
        isOpen={showRefundDialog}
        title="Khởi tạo yêu cầu hoàn tiền"
        targetName={booking.bookingCode}
        description={`Bạn chuẩn bị khởi tạo yêu cầu hoàn lại ${formatVND(booking.pricing.finalTotal)} cho khách hàng ${booking.customer.fullName}.`}
        consequenceWarning="Yêu cầu đối soát hoàn tiền sẽ được gửi tới cổng thanh toán tương ứng. Đơn đặt vé sẽ chuyển sang trạng thái REFUND_PENDING."
        confirmText="Xác nhận hoàn tiền"
        cancelText="Đóng"
        variant="warning"
        isLoading={isRefunding}
        onConfirm={handleRefundBooking}
        onCancel={() => {
          setShowRefundDialog(false)
          setRefundReason('')
        }}
      />
    </div>
  )
}
