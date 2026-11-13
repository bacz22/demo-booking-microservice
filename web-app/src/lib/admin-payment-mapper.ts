import type { BackendPaymentResponse, BackendPaymentStatus } from '@/types/payment'
import type { AdminPaymentAttempt } from '@/services/admin-api.service'
import type { PaymentTimelineItem } from '@/types/admin-payment'

export const PAYMENT_STATUS_LABEL: Record<BackendPaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  SUCCEEDED: 'Thành công',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
}

/** Ánh xạ trạng thái backend sang biến thể của AdminStatusBadge */
export function paymentBadgeStatus(status: BackendPaymentStatus): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'SUCCESS'
    case 'PROCESSING':
      return 'PENDING'
    default:
      return status
  }
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

export function shortId(id: string | null | undefined): string {
  if (!id) return '—'
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase()
}

/** Dựng dòng thời gian từ createdAt, các lần thử (attempts), paidAt, failedAt */
export function buildPaymentTimeline(
  payment: BackendPaymentResponse,
  attempts: AdminPaymentAttempt[],
): PaymentTimelineItem[] {
  const items: PaymentTimelineItem[] = [
    {
      id: 'created',
      title: 'Khởi tạo giao dịch',
      description: `Tạo yêu cầu thanh toán ${formatVND(payment.amount)} cho đơn đặt vé`,
      timestamp: payment.createdAt,
      tone: 'neutral',
    },
  ]
  for (const a of [...attempts].sort((x, y) => x.attemptNumber - y.attemptNumber)) {
    items.push({
      id: `attempt-${a.id}-start`,
      title: `Lần thử #${a.attemptNumber} bắt đầu`,
      description: 'Gửi yêu cầu tới cổng thanh toán',
      timestamp: a.startedAt,
      tone: 'info',
    })
    if (a.endedAt) {
      const ok = a.status === 'SUCCEEDED'
      const failed = a.status === 'FAILED'
      items.push({
        id: `attempt-${a.id}-end`,
        title: `Lần thử #${a.attemptNumber} kết thúc: ${a.status}`,
        description: ok
          ? `Cổng thanh toán xác nhận${a.providerRef ? ` (ref: ${a.providerRef})` : ''}`
          : failed
            ? [a.failureCode, a.failureMessage].filter(Boolean).join(' — ') || 'Thanh toán thất bại'
            : 'Kết thúc lần thử',
        timestamp: a.endedAt,
        tone: ok ? 'success' : failed ? 'danger' : 'neutral',
      })
    }
  }
  if (payment.paidAt) {
    items.push({
      id: 'paid',
      title: 'Thanh toán thành công',
      description: payment.providerRef ? `Mã đối soát: ${payment.providerRef}` : 'Giao dịch đã được ghi nhận',
      timestamp: payment.paidAt,
      tone: 'success',
    })
  }
  if (payment.failedAt) {
    const refunded = payment.status === 'REFUNDED'
    items.push({
      id: 'failed',
      title: refunded ? 'Hoàn tiền' : 'Giao dịch thất bại',
      description: [payment.failureCode, payment.failureMessage].filter(Boolean).join(' — ') || '—',
      timestamp: payment.failedAt,
      tone: refunded ? 'warning' : 'danger',
    })
  }
  return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}
