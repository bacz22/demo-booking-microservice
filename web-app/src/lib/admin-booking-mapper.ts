import type { BackendBookingResponse, BackendBookingSeatResponse } from '@/types/booking'

export const EMPTY = '—'

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return EMPTY
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

/** dd/MM/yyyy HH:mm theo giờ VN */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return EMPTY
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return EMPTY
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return EMPTY
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function seatLabel(seat: BackendBookingSeatResponse): string {
  return `${seat.rowLabel}${seat.seatNumber}`
}

export function seatTypeLabel(type: string): string {
  switch (type?.toUpperCase()) {
    case 'VIP':
      return 'VIP'
    case 'COUPLE':
      return 'Ghế đôi'
    default:
      return 'Thường'
  }
}

export function seatTypeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case 'VIP':
      return 'bg-amber-500/15 border-amber-500/30 text-amber-300'
    case 'COUPLE':
      return 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    default:
      return 'bg-secondary border-border/80 text-foreground'
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}

export type PaymentDisplay = { label: string; className: string }

/** Suy ra trạng thái thanh toán từ trạng thái booking (không gọi API theo từng dòng). */
export function derivePaymentDisplay(b: BackendBookingResponse): PaymentDisplay {
  switch (b.status) {
    case 'CONFIRMED':
      return b.paymentId
        ? { label: 'Đã thanh toán', className: 'text-emerald-400' }
        : { label: 'Đã xác nhận', className: 'text-emerald-400' }
    case 'PENDING_PAYMENT':
      return { label: 'Chờ thanh toán', className: 'text-amber-400' }
    case 'EXPIRED':
      return { label: 'Quá hạn thanh toán', className: 'text-muted-foreground' }
    default:
      return { label: 'Không thanh toán', className: 'text-rose-400' }
  }
}

export interface BookingTimelineItem {
  key: string
  title: string
  description: string
  timestamp: string
  tone: 'info' | 'success' | 'danger' | 'muted'
}

export function buildTimeline(b: BackendBookingResponse): BookingTimelineItem[] {
  const items: BookingTimelineItem[] = [
    {
      key: 'held',
      title: 'Giữ ghế',
      description: `Khách giữ ${b.seats.length} ghế, chờ thanh toán trước ${formatDateTime(b.expiresAt)}`,
      timestamp: b.createdAt,
      tone: 'info',
    },
  ]
  if (b.confirmedAt) {
    items.push({
      key: 'confirmed',
      title: 'Đã thanh toán & xác nhận',
      description: 'Thanh toán thành công, vé đã được xuất',
      timestamp: b.confirmedAt,
      tone: 'success',
    })
  }
  if (b.cancelledAt) {
    items.push({
      key: 'cancelled',
      title: 'Đã huỷ',
      description: b.cancelReason ? `Lý do: ${b.cancelReason}` : 'Đơn đã bị huỷ',
      timestamp: b.cancelledAt,
      tone: 'danger',
    })
  }
  if (b.status === 'EXPIRED') {
    items.push({
      key: 'expired',
      title: 'Hết hạn giữ ghế',
      description: 'Không thanh toán kịp, ghế đã được giải phóng',
      timestamp: b.expiresAt,
      tone: 'muted',
    })
  }
  return items.sort((a, c) => new Date(a.timestamp).getTime() - new Date(c.timestamp).getTime())
}
