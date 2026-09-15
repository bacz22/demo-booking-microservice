import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Copy,
  Check,
  RotateCcw,
  Ban,
  CreditCard,
  Ticket,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  User,
  FlaskConical,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import type { AdminPayment } from '@/types/admin-payment'
import {
  getAdminPaymentById,
  simulatePaymentOutcome,
  refundAdminPayment,
} from '@/mocks/admin/payments'
import { AdminStatusBadge } from '@/components/admin/common/admin-status-badge'
import { AdminConfirmDialog } from '@/components/admin/common/admin-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AdminPaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>()

  const [payment, setPayment] = useState<AdminPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Collapse raw response
  const [showRawResponse, setShowRawResponse] = useState(true)

  // Refund dialog state
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)

  // Simulation loading
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    if (!paymentId) return
    setLoading(true)
    try {
      const data = getAdminPaymentById(paymentId)
      setPayment(data)
    } catch (err) {
      console.error('Failed to load payment detail:', err)
      toast.error('Không thể tải chi tiết giao dịch thanh toán')
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.success(`Đã sao chép ${label}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Refund flow
  const handleConfirmRefund = () => {
    if (!payment) return
    setIsRefunding(true)
    try {
      const res = refundAdminPayment(payment.id, refundReason)
      if (res.success && res.payment) {
        setPayment(res.payment)
        toast.success(res.message)
        setShowRefundDialog(false)
        setRefundReason('')
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi thực hiện hoàn tiền')
    } finally {
      setIsRefunding(false)
    }
  }

  // Mock / Sandbox simulation
  const handleSimulate = (outcome: 'SUCCESS' | 'FAILED') => {
    if (!payment) return
    setIsSimulating(true)
    try {
      const res = simulatePaymentOutcome(payment.id, outcome)
      if (res.success && res.payment) {
        setPayment(res.payment)
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi mô phỏng kết quả')
    } finally {
      setIsSimulating(false)
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
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

  if (!payment) {
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

  const canRefund = payment.status === 'SUCCESS'
  const refundDisabledReason =
    payment.status === 'REFUNDED'
      ? 'Giao dịch này đã được hoàn tiền thành công'
      : payment.status === 'PENDING'
      ? 'Giao dịch đang chờ thanh toán, chưa trừ tiền'
      : payment.status === 'FAILED'
      ? 'Giao dịch đã thất bại, không có khoản tiền để hoàn'
      : undefined

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
              Tạo lúc: {payment.createdAt}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <span>Giao Dịch:</span>
              <span className="font-mono text-primary font-bold">{payment.id}</span>
            </h1>

            <button
              type="button"
              onClick={() => copyToClipboard(payment.id, 'Mã giao dịch')}
              className="p-1.5 rounded-lg border border-border/80 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Sao chép mã giao dịch"
            >
              {copiedKey === 'Mã giao dịch' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <AdminStatusBadge status={payment.status} size="md" />
          </div>
        </div>

        {/* Top Actions: Link to Booking & Refund Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {payment.bookingId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-xl border-border/80 font-bold hover:bg-secondary cursor-pointer"
            >
              <Link to={`/admin/bookings/${payment.bookingId}`}>
                <Ticket className="w-4 h-4 text-primary" />
                <span>Đơn {payment.bookingCode}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
              </Link>
            </Button>
          )}

          {/* Refund Action Button */}
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canRefund}
              onClick={() => setShowRefundDialog(true)}
              className="h-9 gap-1.5 rounded-xl border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoàn tiền giao dịch</span>
            </Button>
            {!canRefund && refundDisabledReason && (
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-20 w-64 p-2 rounded-xl bg-popover border border-border/80 text-[11px] text-muted-foreground shadow-xl">
                {refundDisabledReason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mock Sandbox Alert Banner per prompt.txt (simulate success/failure in local/mock env) */}
      {payment.status === 'PENDING' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Mock / Local Sandbox Tool
                </span>
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300">
                  Môi trường thử nghiệm
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Giao dịch này đang ở trạng thái <strong className="text-amber-300">PENDING</strong>. Bạn có thể giả lập Webhook phản hồi từ cổng thanh toán để kiểm thử quy trình microservices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              type="button"
              size="sm"
              disabled={isSimulating}
              onClick={() => handleSimulate('FAILED')}
              className="h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Simulate Thất bại</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isSimulating}
              onClick={() => handleSimulate('SUCCESS')}
              className="h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simulate Thành công</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Summary Card & Raw Response (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Summary Box */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Thông tin đối soát thanh toán</span>
              </h2>
              <span className="text-xs font-mono font-bold text-foreground">
                {payment.method}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Số tiền giao dịch:</span>
                <span className="font-mono font-black text-xl text-foreground tabular-nums block">
                  {formatVND(payment.amount)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Đơn vị tính: {payment.currency}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <span className="text-muted-foreground block text-[11px]">Mã đối soát cổng (Provider Ref):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-primary text-sm truncate">
                    {payment.providerRef}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(payment.providerRef, 'Provider Ref')}
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
                {payment.bankCode && (
                  <span className="text-[11px] text-muted-foreground block">
                    Ngân hàng: <strong>{payment.bankCode}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Additional Info Table */}
            <div className="space-y-2 text-xs border-t border-border/60 pt-3">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Đơn đặt vé liên kết:</span>
                <Link
                  to={`/admin/bookings/${payment.bookingId}`}
                  className="font-mono font-bold text-primary hover:underline"
                >
                  {payment.bookingCode}
                </Link>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Thời gian trừ tiền (Paid at):</span>
                <span className="font-mono text-foreground">
                  {payment.paidAt || 'Chưa ghi nhận'}
                </span>
              </div>

              {payment.refundedAt && (
                <div className="flex justify-between py-1 border-b border-border/40 text-indigo-400">
                  <span>Thời gian hoàn tiền:</span>
                  <span className="font-mono">{payment.refundedAt}</span>
                </div>
              )}

              {payment.refundReason && (
                <div className="flex justify-between py-1 text-indigo-400">
                  <span>Lý do hoàn tiền:</span>
                  <span className="italic">{payment.refundReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Raw Response JSON Viewer (Collapsible & Redacted per prompt.txt) */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawResponse(!showRawResponse)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dữ liệu phản hồi gốc (Raw Gateway Response — Redacted)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã bảo mật dữ liệu thẻ</span>
                </span>
                {showRawResponse ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {showRawResponse && (
              <div className="p-4 pt-0 border-t border-border/60 bg-secondary/10 space-y-2">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    JSON Content ({Object.keys(payment.rawResponse).length} fields)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(payment.rawResponse, null, 2),
                        'Raw JSON Response'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Sao chép JSON</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-background/80 border border-border/80 font-mono text-[11px] text-foreground overflow-x-auto leading-relaxed shadow-inner">
                  {JSON.stringify(payment.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Customer & Transaction Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer Card */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <User className="w-4 h-4 text-primary" />
              <span>Người thực hiện thanh toán</span>
            </h2>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-black font-heading text-primary text-sm shrink-0">
                {payment.customer.fullName.charAt(0)}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-foreground text-sm truncate">
                  {payment.customer.fullName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {payment.customer.email}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {payment.customer.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Timeline per prompt.txt */}
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Tiến trình xử lý (Transaction Timeline)</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {payment.timeline.length} mốc
              </span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
              {payment.timeline.map((event, index) => {
                const isLatest = index === payment.timeline.length - 1

                return (
                  <div key={event.id} className="relative space-y-1">
                    {/* Event Dot */}
                    <div
                      className={cn(
                        'absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-card',
                        event.step === 'SUCCESS'
                          ? 'border-emerald-500 text-emerald-500'
                          : event.step === 'FAILED'
                          ? 'border-rose-500 text-rose-500'
                          : event.step === 'REFUNDED'
                          ? 'border-indigo-500 text-indigo-500'
                          : isLatest
                          ? 'border-primary text-primary'
                          : 'border-muted-foreground/40 text-muted-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          event.step === 'SUCCESS'
                            ? 'bg-emerald-500'
                            : event.step === 'FAILED'
                            ? 'bg-rose-500'
                            : event.step === 'REFUNDED'
                            ? 'bg-indigo-500'
                            : 'bg-primary'
                        )}
                      />
                    </div>

                    {/* Event Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{event.title}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase',
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

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>

                    {event.responseCode && (
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Response Code: <strong className="text-foreground">{event.responseCode}</strong>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Refund Dialog */}
      <AdminConfirmDialog
        isOpen={showRefundDialog}
        title="Xác nhận hoàn tiền giao dịch"
        targetName={payment.id}
        description={`Bạn chuẩn bị kích hoạt lệnh hoàn tiền ${formatVND(payment.amount)} cho khách hàng "${payment.customer.fullName}".`}
        consequenceWarning="Lệnh hoàn tiền sẽ được gửi tới cổng thanh toán tương ứng và không thể đảo ngược. Đơn đặt vé liên quan sẽ được chuyển trạng thái sang REFUNDED."
        confirmText="Xác nhận hoàn tiền"
        cancelText="Đóng"
        variant="warning"
        isLoading={isRefunding}
        onConfirm={handleConfirmRefund}
        onCancel={() => {
          setShowRefundDialog(false)
          setRefundReason('')
        }}
      />
    </div>
  )
}
