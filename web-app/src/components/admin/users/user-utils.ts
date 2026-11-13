import { ApiClientError } from '@/lib/api-client'

export const USER_STATUS_LABEL: Record<'ACTIVE' | 'LOCKED', string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khoá',
}

/** Thông điệp lỗi hiển thị cho admin (ưu tiên message tiếng Việt từ backend) */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError && err.message) return err.message
  return fallback
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}
