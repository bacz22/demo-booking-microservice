import type { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  description: ReactNode
  duration?: number
  timestamp: number
  /** Key dùng để chống spam thông báo trùng lặp */
  dedupeKey?: string
}

export interface ToastOptions {
  id?: string
  title?: string
  description: ReactNode
  type?: ToastType
  duration?: number
}

export interface BookingSuccessToastParams {
  bookingCode: string
  movieTitle?: string
  seats?: string[]
}
