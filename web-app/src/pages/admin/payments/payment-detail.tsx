import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Copy,
  Check,
  Ban,
  CreditCard,
  Ticket,
  Activity,
  User,
  ExternalLink,
  AlertTriangle,
  ListOrdered,
} from 'lucide-react'
import {
  adminPaymentApi,
  adminUserApi,
  adminBookingApi,
  type AdminPaymentDetail as AdminPaymentDetailData,
} from '@/services/admin-api.service'
import type { BackendAuthUser } from '@/services/auth-api.service'
import { ApiClientError } from '@/lib/api-client'
import {
  PAYMENT_STATUS_LABEL,
  buildPaymentTimeline,
  formatDateTime,
  formatVND,
  paymentBadgeStatus,
  shortId,
} from '@/lib/admin-payment-mapper'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { Button } from '@/components/ui/button'
import { PageErrorState } from '@/components/ui/page-error-state'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminPaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>()

  const [detail, setDetail] = useState<AdminPaymentDetailData | null>(null)
  const [customer, setCustomer] = useState<BackendAuthUser | null>(null)
  const [bookingCode, setBookingCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!paymentId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await adminPaymentApi.get(paymentId)
      setDetail(data)
      // Thông tin phụ: lỗi thì bỏ qua, không chặn trang
      const [users, booking] = await Promise.all([
        adminUserApi.byIds([data.payment.userId]).catch(() => ({}) as Record<string, BackendAuthUser>),
        adminBookingApi.get(data.payment.bookingId).catch(() => null),
      ])
      setCustomer(users[data.payment.userId] ?? null)
      setBookingCode(booking?.bookingCode ?? null)
    } catch (err) {
      console.error('Failed to load payment detail:', err)
      if (err instanceof ApiClientError && err.status === 404) setNotFound(true)
      else setError(err instanceof Error ? err.message : 'Không thể tải chi tiết giao dịch thanh toán')
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    void load()
  }, [load])

  const timeline = useMemo(
    () => (detail ? buildPaymentTimeline(detail.payment, detail.attempts) : []),
    [detail],
  )

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.success(`Đã sao chép ${label}`)
    setTimeout(() => setCopiedKey(null), 2000)
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

  if (error) {
    return (
      <PageErrorState
        title="Không thể tải chi tiết giao dịch"
        message={error}
        onRetry={() => void load()}
      />
    )
  }

  if (notFound || !detail) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
          <Ban className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy giao dịch</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Mã giao dịch &quot;{paymentId}&quot; không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/admin/payments">Quay lại danh sách thanh toán</Link>
        </Button>
      </div>
    )
  }

  const payment = detail.payment
  const attempts = [...detail.attempts].sort((a, b) => a.attemptNumber - b.attemptNumber)
  const bookingLabel = bookingCode ?? shortId(payment.bookingId)
  const hasFailure = Boolean(payment.failureCode || payment.failureMessage)

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Link to="/admin/payments">
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span>Danh sách thanh toán</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">
              Tạo lúc: {formatDateTime(payment.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <span>Giao Dịch:</span>
              <span className="font-mono text-primary font-bold">{payment.paymentCode}</span>
            </h1>

            <button
              type="button"
              onClick={() => copyToClipboard(payment.paymentCode, 'Mã giao dịch')}
              className="p-1.5 rounded-lg border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Sao chép mã giao dịch"
            >
              {copiedKey === 'Mã giao dịch' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <AdminStatusBadge
              status={paymentBadgeStatus(payment.status)}
              label={PAYMENT_STATUS_LABEL[payment.status]}
              size="md"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl border-border/80 font-bold hover:bg-secondary cursor-pointer"
          >
            <Link to={`/admin/bookings/${payment.bookingId}`}>
              <Ticket className="w-4 h-4 text-primary" />
              <span>Đơn {bookingLabel}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Failure / refund reason */}
      {hasFailure && (
        <div
          className={cn(
            'rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-md',
            payment.status === 'REFUNDED'
              ? 'border-indigo-500/30 bg-indigo-500/10'
              : 'border-rose-500/30 bg-rose-500/10',
          )}
        >
          <AlertTriangle
            className={cn('w-5 h-5 shrink-0', payment.status === 'REFUNDED' ? 'text-indigo-400' : 'text-rose-400')}
          />
          <div className="space-y-0.5 text-xs">
            <div className="font-bold uppercase tracking-wider text-foreground">
              {payment.status === 'REFUNDED' ? 'Lý do hoàn tiền' : 'Lý do thất bại'}
              {payment.failureCode && <span className="ml-2 font-mono">{payment.failureCode}</span>}
            </div>
            {payment.failureMessage && <p className="text-muted-foreground">{payment.failureMessage}</p>}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Summary Box */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Thông tin đối soát thanh toán</span>
              </h2>
              <span className="text-xs font-mono font-bold text-foreground">{payment.method}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Số tiền giao dịch:</span>
                <span className="font-mono font-black text-xl text-foreground tabular-nums block">
                  {formatVND(payment.amount)}
                </span>
                <span className="text-[11px] text-muted-foreground">Đơn vị tính: {payment.currency}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Mã đối soát cổng (Provider Ref):</span>
                {payment.providerRef ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-primary text-sm truncate">{payment.providerRef}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.providerRef ?? '', 'Provider Ref')}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Sao chép mã đối soát"
                    >
                      {copiedKey === 'Provider Ref' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-muted-foreground block">Chưa có</span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-border/60 pt-3">
              {[
                ['Đơn đặt vé liên kết:', null],
                ['Mã nội bộ (Payment ID):', payment.id],
                ['Hạn giữ chỗ của đơn:', formatDateTime(payment.bookingExpiresAt)],
                ['Thời gian thanh toán (Paid at):', payment.paidAt ? formatDateTime(payment.paidAt) : 'Chưa ghi nhận'],
                ['Thời gian thất bại / hoàn (Failed at):', formatDateTime(payment.failedAt)],
                ['Cập nhật lần cuối:', formatDateTime(payment.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-1 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  {value === null ? (
                    <Link
                      to={`/admin/bookings/${payment.bookingId}`}
                      className="font-mono font-bold text-primary hover:underline"
                      title={payment.bookingId}
                    >
                      {bookingLabel}
                    </Link>
                  ) : (
                    <span className="font-mono text-foreground text-right break-all">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Attempts */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary" />
                <span>Các lần thử thanh toán</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">{attempts.length} lần</span>
            </div>
            {attempts.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">Chưa có lần thử thanh toán nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-secondary/30 text-muted-foreground uppercase text-[11px]">
                      <th className="py-2.5 pl-4 pr-2">#</th>
                      <th className="py-2.5 px-2">Trạng thái</th>
                      <th className="py-2.5 px-2">Provider Ref</th>
                      <th className="py-2.5 px-2">Bắt đầu</th>
                      <th className="py-2.5 px-2 pr-4">Kết thúc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {attempts.map((a) => (
                      <tr key={a.id} className="align-top">
                        <td className="py-2.5 pl-4 pr-2 font-mono font-bold">{a.attemptNumber}</td>
                        <td className="py-2.5 px-2">
                          <span className="font-mono font-bold">{a.status}</span>
                          {(a.failureCode || a.failureMessage) && (
                            <div className="text-[11px] text-rose-400">
                              {[a.failureCode, a.failureMessage].filter(Boolean).join(' — ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-muted-foreground">{a.providerRef ?? '—'}</td>
                        <td className="py-2.5 px-2 font-mono text-muted-foreground">{formatDateTime(a.startedAt)}</td>
                        <td className="py-2.5 px-2 pr-4 font-mono text-muted-foreground">{formatDateTime(a.endedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Customer Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="w-4 h-4 text-primary" />
              <span>Người thực hiện thanh toán</span>
            </h2>

            {customer ? (
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-black font-heading text-primary text-sm shrink-0">
                  {customer.fullName.charAt(0)}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">{customer.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">{customer.email}</div>
                  {customer.phone && <div className="text-xs text-muted-foreground font-mono">{customer.phone}</div>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Không tải được thông tin khách hàng. User ID:{' '}
                <span className="font-mono text-foreground break-all">{payment.userId}</span>
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Tiến trình xử lý</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">{timeline.length} mốc</span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
              {timeline.map((event) => {
                const color =
                  event.tone === 'success'
                    ? 'emerald'
                    : event.tone === 'danger'
                      ? 'rose'
                      : event.tone === 'warning'
                        ? 'indigo'
                        : event.tone === 'info'
                          ? 'primary'
                          : 'muted'
                return (
                  <div key={event.id} className="relative space-y-1">
                    <div
                      className={cn(
                        'absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-card',
                        color === 'emerald' && 'border-emerald-500',
                        color === 'rose' && 'border-rose-500',
                        color === 'indigo' && 'border-indigo-500',
                        color === 'primary' && 'border-primary',
                        color === 'muted' && 'border-muted-foreground/40',
                      )}
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          color === 'emerald' && 'bg-emerald-500',
                          color === 'rose' && 'bg-rose-500',
                          color === 'indigo' && 'bg-indigo-500',
                          (color === 'primary' || color === 'muted') && 'bg-primary',
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{event.title}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed break-words">{event.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
