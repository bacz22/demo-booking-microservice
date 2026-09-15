import type { ReactNode } from 'react'
import type { ToastOptions, ToastItem, BookingSuccessToastParams } from '@/types/toast'

type ToastListener = (toast: ToastItem) => void
type DismissListener = (id: string) => void

const listeners = new Set<ToastListener>()
const dismissListeners = new Set<DismissListener>()
const pendingQueue: ToastItem[] = []

// Chống spam: map lưu timestamp các toast gần nhất
const lastTriggerMap = new Map<string, number>()
const DEDUPE_WINDOW_MS = 2500

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener)
  // Flush any pending toasts dispatched before subscription
  if (pendingQueue.length > 0) {
    const queue = [...pendingQueue]
    pendingQueue.length = 0
    queue.forEach((item) => listener(item))
  }
  return () => {
    listeners.delete(listener)
  }
}

export function subscribeDismiss(listener: DismissListener): () => void {
  dismissListeners.add(listener)
  return () => {
    dismissListeners.delete(listener)
  }
}

function dispatchToast(options: ToastOptions): string {
  const now = Date.now()
  const type = options.type || 'info'
  const title = options.title || ''
  const descString = typeof options.description === 'string' ? options.description : ''
  const dedupeKey = options.id || `${type}:${title}:${descString}`

  // Cơ chế chống spam: Bỏ qua nếu nội dung trùng lặp xuất hiện liên tục trong DEDUPE_WINDOW_MS
  const lastTime = lastTriggerMap.get(dedupeKey)
  if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
    return dedupeKey
  }

  lastTriggerMap.set(dedupeKey, now)
  setTimeout(() => {
    lastTriggerMap.delete(dedupeKey)
  }, 5000)

  const id = options.id || `toast-${now}-${Math.random().toString(36).substring(2, 7)}`
  const item: ToastItem = {
    id,
    type,
    title: options.title,
    description: options.description,
    duration: options.duration ?? 4000,
    timestamp: now,
    dedupeKey,
  }

  if (listeners.size === 0) {
    pendingQueue.push(item)
  } else {
    listeners.forEach((listener) => listener(item))
  }
  return id
}

export const toast = {
  /**
   * Quy tắc 1: Booking Success (Đặt vé thành công)
   * Hiển thị mã đặt vé, thông tin phim và số ghế đã đặt.
   */
  bookingSuccess: ({ bookingCode, movieTitle, seats }: BookingSuccessToastParams) => {
    const seatInfo = seats && seats.length > 0 ? ` (Ghế: ${seats.join(', ')})` : ''
    const movieInfo = movieTitle ? ` cho phim "${movieTitle}"` : ''
    return dispatchToast({
      type: 'success',
      title: 'Đặt vé thành công!',
      description: `Mã vé [${bookingCode}]${movieInfo}${seatInfo} đã được xác nhận. Vui lòng kiểm tra email của bạn.`,
      duration: 5000,
    })
  },

  /**
   * Quy tắc 2: Seat Error (Lỗi chọn ghế)
   * Cảnh báo khi ghế đã có người giữ, đã được thanh toán hoặc không hợp lệ.
   */
  seatError: (message = 'Ghế này hiện đã có người chọn hoặc đã bán. Vui lòng chọn ghế khác.') => {
    return dispatchToast({
      type: 'warning',
      title: 'Lỗi chọn ghế',
      description: message,
      duration: 4000,
    })
  },

  /**
   * Quy tắc 3: Payment Error (Lỗi thanh toán)
   * Thông báo lỗi thẻ, cổng thanh toán hoặc phiên đặt vé hết hạn.
   */
  paymentError: (message = 'Giao dịch thanh toán chưa thành công hoặc đã hết hạn thanh toán. Vui lòng kiểm tra lại.') => {
    return dispatchToast({
      type: 'error',
      title: 'Lỗi thanh toán',
      description: message,
      duration: 4500,
    })
  },

  /**
   * Quy tắc 4: API Failure (Lỗi kết nối máy chủ)
   * Thông báo khi mất kết nối mạng hoặc server không phản hồi.
   */
  apiFailure: (message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại sau.') => {
    return dispatchToast({
      type: 'error',
      title: 'Lỗi kết nối máy chủ',
      description: message,
      duration: 4500,
    })
  },

  /** Thông báo chung */
  success: (description: ReactNode, title = 'Thành công') => {
    return dispatchToast({ type: 'success', title, description })
  },
  error: (description: ReactNode, title = 'Đã có lỗi xảy ra') => {
    return dispatchToast({ type: 'error', title, description })
  },
  warning: (description: ReactNode, title = 'Cảnh báo') => {
    return dispatchToast({ type: 'warning', title, description })
  },
  info: (description: ReactNode, title = 'Thông báo') => {
    return dispatchToast({ type: 'info', title, description })
  },

  /** Đóng toast theo ID */
  dismiss: (id: string) => {
    dismissListeners.forEach((listener) => listener(id))
  },
}

export default toast
