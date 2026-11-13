import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Copy, Check, Ban, User, Film, CreditCard, Ticket, Activity } from 'lucide-react'
import type { BackendBookingResponse } from '@/types/booking'
import type { BackendPaymentResponse } from '@/types/payment'
import type { BackendAuthUser } from '@/services/auth-api.service'
import { adminBookingApi, adminPaymentApi, adminUserApi } from '@/services/admin-api.service'
import { ApiClientError } from '@/lib/api-client'
import {
  EMPTY,
  buildTimeline,
  derivePaymentDisplay,
  formatDate,
  formatDateTime,
  formatTime,
  formatVND,
  initials,
  seatLabel,
  seatTypeClass,
  seatTypeLabel,
} from '@/lib/admin-booking-mapper'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { PageErrorState } from '@/components/ui/page-error-state'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  SUCCEEDED: 'Thành công',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
}

const TONE_CLASS = {
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  danger: 'bg-rose-400',
  muted: 'bg-zinc-400',
} as const

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon className="w-4 h-4 text-primary" />
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-foreground font-semibold text-right break-all', mono && 'font-mono')}>{value}</span>
    </div>
  )
}

export default function AdminBookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>()

  const [booking, setBooking] = useState<BackendBookingResponse | null>(null)
  const [customer, setCustomer] = useState<BackendAuthUser | null>(null)
  const [payments, setPayments] = useState<BackendPaymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ notFound: boolean; message: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const load = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminBookingApi.get(bookingId)
      setBooking(data)
      const [users, paymentPage] = await Promise.all([
        adminUserApi.byIds([data.userId]).catch(() => ({}) as Record<string, BackendAuthUser>),
        adminPaymentApi.list({ bookingId: data.id, pageSize: 20 }).catch(() => null),
      ])
      setCustomer(users[data.userId] ?? null)
      setPayments(paymentPage?.items ?? [])
    } catch (err) {
      console.error('Failed to load booking detail:', err)
      setBooking(null)
      setError({
        notFound: err instanceof ApiClientError && err.status === 404,
        message: err instanceof Error ? err.message : 'Không thể tải thông tin đơn đặt vé',
      })
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    void load()
  }, [load])

  const copyToClipboard = (text: string, keyName: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(keyName)
    toast.success(`Đã sao chép ${keyName}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCancelBooking = async () => {
    if (!booking) return
    setIsCancelling(true)
    try {
      const updated = await adminBookingApi.cancel(booking.id, 'Quản trị viên huỷ đơn')
      setBooking(updated)
      toast.success(`Đã huỷ đơn ${booking.bookingCode}`)
      setShowCancelDialog(false)
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 409 || err.code === 'INVALID_BOOKING_STATE')) {
        toast.error('Đơn đã thanh toán hoặc đã kết thúc, không thể huỷ tại đây')
        void load()
      } else {
        toast.error('Có lỗi xảy ra khi huỷ đơn')
      }
    } finally {
      setIsCancelling(false)
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
    if (error && !error.notFound) {
      return (
        <PageErrorState
          title="Không thể tải đơn đặt vé"
          message={error.message}
          onRetry={() => void load()}
        />
      )
    }
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

  const canCancel = booking.status === 'PENDING_PAYMENT'
  const cancelDisabledReason =
    booking.status === 'CONFIRMED'
      ? 'Đơn đã thanh toán, không thể huỷ tại đây'
      : booking.status === 'CANCELLED'
      ? 'Đơn đặt vé này đã bị hủy trước đó'
      : booking.status === 'EXPIRED'
      ? 'Đơn đặt vé đã hết hạn thanh toán'
      : undefined
  const timeline = buildTimeline(booking)
  const paymentDisplay = derivePaymentDisplay(booking)
  const mainPayment = payments.find((p) => p.id === booking.paymentId) ?? payments[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại danh sách đặt vé
        </Link>
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black font-heading text-foreground font-mono">{booking.bookingCode}</h1>
              <button
                type="button"
                onClick={() => copyToClipboard(booking.bookingCode, 'mã đơn')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                title="Sao chép mã đơn"
              >
                {copiedKey === 'mã đơn' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <AdminStatusBadge status={booking.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              Tạo lúc {formatDateTime(booking.createdAt)}
              {booking.updatedAt ? ` • Cập nhật ${formatDateTime(booking.updatedAt)}` : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!canCancel}
            title={cancelDisabledReason}
            onClick={() => setShowCancelDialog(true)}
            className="rounded-xl gap-1.5"
          >
            <Ban className="w-4 h-4" />
            Huỷ đơn
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Movie & showtime */}
          <Section icon={Film} title="Phim & suất chiếu">
            <div className="flex gap-4">
              {booking.posterUrl ? (
                <img
                  src={booking.posterUrl}
                  alt={booking.movieTitle ?? ''}
                  className="w-20 h-28 rounded-lg object-cover border border-border/60 shrink-0"
                />
              ) : (
                <div className="w-20 h-28 rounded-lg border border-border/60 bg-secondary shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <div className="text-base font-bold text-foreground">{booking.movieTitle ?? EMPTY}</div>
                <Row label="Rạp" value={booking.theaterName ?? EMPTY} />
                <Row label="Thành phố" value={booking.theaterCity ?? EMPTY} />
                <Row label="Phòng chiếu" value={booking.auditoriumName ?? EMPTY} />
                <Row
                  label="Suất chiếu"
                  value={
                    booking.showtimeStart
                      ? `${formatTime(booking.showtimeStart)} – ${formatTime(booking.showtimeEnd)} • ${formatDate(booking.showtimeStart)}`
                      : EMPTY
                  }
                />
              </div>
            </div>
          </Section>

          {/* Seats & pricing */}
          <Section icon={Ticket} title={`Ghế đã đặt (${booking.seats.length})`}>
            <div className="divide-y divide-border/60">
              {booking.seats.map((seat) => (
                <div key={seat.seatId} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border',
                        seatTypeClass(seat.seatType)
                      )}
                    >
                      {seatLabel(seat)}
                    </span>
                    <span className="text-muted-foreground">{seatTypeLabel(seat.seatType)}</span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">{formatVND(seat.price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/80 pt-3 space-y-2">
              <Row label="Tiền ghế" value={formatVND(booking.totalAmount)} mono />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Tổng thanh toán</span>
                <span className="text-lg font-black font-mono text-primary">{formatVND(booking.totalAmount)}</span>
              </div>
            </div>
          </Section>

          {/* Timeline */}
          <Section icon={Activity} title="Lịch sử trạng thái">
            <ol className="relative border-l border-border/80 ml-2 space-y-4">
              {timeline.map((item) => (
                <li key={item.key} className="ml-4">
                  <span className={cn('absolute -left-1.5 w-3 h-3 rounded-full mt-1', TONE_CLASS[item.tone])} />
                  <div className="text-xs font-bold text-foreground">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground">{item.description}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{formatDateTime(item.timestamp)}</div>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <Section icon={User} title="Khách hàng">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold flex items-center justify-center">
                {initials(customer?.fullName)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground truncate">{customer?.fullName ?? 'Khách hàng'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{customer?.email ?? EMPTY}</div>
              </div>
            </div>
            <Row label="Số điện thoại" value={customer?.phone ?? EMPTY} mono />
            <Row label="User ID" value={booking.userId} mono />
          </Section>

          {/* Payment */}
          <Section icon={CreditCard} title="Thanh toán">
            <Row
              label="Trạng thái"
              value={<span className={paymentDisplay.className}>{paymentDisplay.label}</span>}
            />
            {mainPayment ? (
              <>
                <Row label="Mã giao dịch" value={mainPayment.paymentCode} mono />
                <Row label="Phương thức" value={mainPayment.method} mono />
                <Row label="Số tiền" value={formatVND(mainPayment.amount)} mono />
                <Row label="Kết quả" value={PAYMENT_STATUS_LABEL[mainPayment.status] ?? mainPayment.status} />
                {mainPayment.providerRef && <Row label="Mã nhà cung cấp" value={mainPayment.providerRef} mono />}
                <Row label="Thanh toán lúc" value={formatDateTime(mainPayment.paidAt)} />
                {mainPayment.failureMessage && <Row label="Lỗi" value={mainPayment.failureMessage} />}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có giao dịch thanh toán cho đơn này.</p>
            )}
            {payments.length > 0 && (
              <Button asChild variant="outline" size="sm" className="w-full rounded-xl">
                <Link to={`/admin/payments?bookingId=${booking.id}`}>
                  Xem {payments.length} giao dịch thanh toán
                </Link>
              </Button>
            )}
          </Section>

          {booking.cancelReason && (
            <Section icon={Ban} title="Lý do huỷ">
              <p className="text-xs text-foreground">{booking.cancelReason}</p>
            </Section>
          )}
        </div>
      </div>

      <AdminConfirmDialog
        isOpen={showCancelDialog}
        title="Xác nhận hủy đơn đặt vé"
        targetName={booking.bookingCode}
        description={`Bạn đang huỷ đơn chờ thanh toán của khách hàng "${customer?.fullName ?? booking.userId}". Trạng thái đơn sẽ chuyển thành CANCELLED.`}
        consequenceWarning="Các ghế đang giữ trong đơn này sẽ được giải phóng để khách hàng khác có thể chọn."
        confirmText="Hủy đơn đặt vé"
        cancelText="Đóng"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={() => void handleCancelBooking()}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  )
}
